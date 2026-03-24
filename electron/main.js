const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const { setupKioskGuard } = require('./kiosk-guard');
const { CameraService } = require('./camera-service');
const { PrinterService } = require('./printer-service');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

let mainWindow = null;
let cameraService = null;
let printerService = null;

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

// ── Find Next.js Server Path ─────────────────────────────────────────
function findServerPath() {
  const candidates = [];

  // electron-builder 패키징 후 (extraResources/standalone)
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'standalone', 'server.js'));
  }

  // __dirname 상위 (개발 모드 또는 비패키징)
  candidates.push(path.join(__dirname, '..', '.next', 'standalone', 'server.js'));

  for (const p of candidates) {
    console.log(`[Startup] Checking server path: ${p}`);
    if (fs.existsSync(p)) {
      console.log(`[Startup] Found server at: ${p}`);
      return p;
    }
  }

  const fallback = candidates[candidates.length - 1];
  console.error(`[Startup] Server not found! Checked paths:\n${candidates.join('\n')}`);
  console.error(`[Startup] Using fallback: ${fallback}`);
  return fallback;
}

// ── Start Next.js Standalone Server ───────────────────────────────────
function startNextServer() {
  return new Promise((resolve) => {
    if (isDev) {
      resolve();
      return;
    }

    const serverPath = findServerPath();
    const serverDir = path.dirname(serverPath);

    // Electron 내장 Node.js로 직접 서버 실행 (별도 node 설치 불필요)
    process.env.PORT = String(PORT);
    process.env.HOSTNAME = '0.0.0.0';
    process.chdir(serverDir);

    console.log(`[Next.js] Starting server from: ${serverPath}`);
    console.log(`[Next.js] Working directory: ${serverDir}`);

    require(serverPath);
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
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
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

  // ── Camera service (Canon EDSDK) ──
  cameraService = new CameraService();
  cameraService.initialize(mainWindow).catch((err) => {
    console.error('[CameraService] Initialization failed:', err.message);
    // IPC is already registered inside initialize(), webcam fallback active
  });

  // ── Printer service ──
  printerService = new PrinterService();
  printerService.registerIPC();

  // ── Grant camera/microphone permissions automatically ──
  const allowedPermissions = ['media', 'mediaKeySystem', 'display-capture'];
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(allowedPermissions.includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return allowedPermissions.includes(permission);
  });

  // ── CSP: WASM 실행 허용 (MediaPipe) ──
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* https://*.googleapis.com https://*.supabase.co https://*.fal.ai; worker-src 'self' blob:;",
        ],
      },
    });
  });

  // Load the app
  mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── App Lifecycle ─────────────────────────────────────────────────────
app.on('before-quit', () => {
  app.isQuitting = true;

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
