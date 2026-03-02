const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const { setupKioskGuard } = require('./kiosk-guard');
const { CameraService } = require('./camera-service');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

let mainWindow = null;
let nextServer = null;
let cameraService = null;

// ── Single Instance Lock ──────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── Start Next.js Standalone Server ───────────────────────────────────
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve();
      return;
    }

    const serverPath = path.join(process.resourcesPath || path.join(__dirname, '..'), '.next', 'standalone', 'server.js');
    nextServer = spawn('node', [serverPath], {
      cwd: path.dirname(serverPath),
      env: { ...process.env, PORT: String(PORT), HOSTNAME: '0.0.0.0' },
      stdio: 'pipe',
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });
    nextServer.stderr.on('data', (data) => {
      console.error(`[Next.js ERR] ${data.toString().trim()}`);
    });
    nextServer.on('error', (err) => {
      console.error('[Next.js] Failed to start:', err);
      reject(err);
    });
    nextServer.on('exit', (code) => {
      console.log(`[Next.js] exited with code ${code}`);
    });

    resolve();
  });
}

// ── Poll Server Until Ready ───────────────────────────────────────────
function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server did not respond within ${timeoutMs / 1000}s`));
      }
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
          setTimeout(check, 300);
        }
      }).on('error', () => {
        setTimeout(check, 300);
      });
    };
    check();
  });
}

// ── Create Main BrowserWindow ─────────────────────────────────────────
function createWindow() {
  const windowConfig = isDev
    ? {
        width: 1080,
        height: 1920,
        frame: true,
        kiosk: false,
        fullscreen: false,
        backgroundColor: '#000000',
        show: false,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          devTools: true,
          sandbox: true,
          navigateOnDragDrop: false,
          spellcheck: false,
        },
      }
    : {
        kiosk: true,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        closable: false,
        resizable: false,
        movable: false,
        minimizable: false,
        backgroundColor: '#000000',
        show: false,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          devTools: false,
          sandbox: true,
          navigateOnDragDrop: false,
          spellcheck: false,
        },
      };

  mainWindow = new BrowserWindow(windowConfig);

  // Show window once content is painted
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  // ── Navigation guard: block non-localhost URLs ──
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsed = new URL(url);
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      event.preventDefault();
      console.warn('[Security] Blocked navigation to:', url);
    }
  });

  // ── Block popup windows ──
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // ── Inject kiosk CSS + JS after page loads ──
  mainWindow.webContents.on('did-finish-load', () => {
    // CSS: disable selection, callout, overscroll
    mainWindow.webContents.insertCSS([
      '*, *::before, *::after {',
      '  -webkit-user-select: none !important;',
      '  user-select: none !important;',
      '  -webkit-touch-callout: none !important;',
      '}',
      'html, body {',
      '  touch-action: manipulation !important;',
      '  overscroll-behavior: none !important;',
      '}',
    ].join('\n'));

    // JS: block contextmenu, selection, drag, zoom gestures
    mainWindow.webContents.executeJavaScript(`
      document.addEventListener('contextmenu', e => e.preventDefault(), true);
      document.addEventListener('selectstart', e => e.preventDefault(), true);
      document.addEventListener('dragstart', e => e.preventDefault(), true);
      document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false, capture: true });

      // Block double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) { e.preventDefault(); }
        lastTouchEnd = now;
      }, { passive: false });

      // Block pinch zoom (multi-touch)
      document.addEventListener('touchmove', e => {
        if (e.touches.length > 1) { e.preventDefault(); }
      }, { passive: false });

      // Block gesture events (Safari / Chromium)
      document.addEventListener('gesturestart', e => e.preventDefault(), true);
      document.addEventListener('gesturechange', e => e.preventDefault(), true);
      document.addEventListener('gestureend', e => e.preventDefault(), true);
    `);
  });

  // ── Re-focus on blur (Alt+Tab fallback) ──
  if (!isDev) {
    mainWindow.on('blur', () => {
      if (!app.isQuitting && !mainWindow.isDestroyed()) {
        setTimeout(() => {
          if (!app.isQuitting && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.moveTop();
          }
        }, 100);
      }
    });
  }

  // ── Prevent close unless quitting ──
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });

  // ── Setup kiosk guard (keyboard shortcut blocking) ──
  if (!isDev) {
    setupKioskGuard(mainWindow, app);
  }

  // ── Setup camera service (digiCamControl integration) ──
  cameraService = new CameraService();
  cameraService.initialize().catch((err) => {
    console.error('[CameraService] Initialization failed (camera may not be connected):', err.message);
    // registerIPC is called inside initialize, but if it fails early, ensure IPC is still registered
    cameraService.registerIPC();
  });

  // Load the app
  mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── App Lifecycle ─────────────────────────────────────────────────────
app.on('before-quit', () => {
  app.isQuitting = true;

  if (nextServer && !nextServer.killed) {
    nextServer.kill('SIGTERM');
    nextServer = null;
  }

  if (cameraService) {
    cameraService.shutdown();
    cameraService = null;
  }
});

app.whenReady().then(async () => {
  try {
    await startNextServer();
    await waitForServer(`http://localhost:${PORT}`);
    createWindow();
  } catch (err) {
    console.error('[Startup] Fatal error:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
