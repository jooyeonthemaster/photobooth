const { globalShortcut } = require('electron');

/**
 * Register global shortcuts and input guards to lock down the kiosk.
 * @param {Electron.BrowserWindow} mainWindow
 * @param {Electron.App} app
 */
function setupKioskGuard(mainWindow, app) {
  // ── Force quit helper (process.exit 안전장치 포함) ─────────────────
  function forceQuit(source) {
    console.log(`[KioskGuard] Admin escape triggered (${source}) — quitting.`);
    app.isQuitting = true;
    app.quit();
    // app.quit()이 Windows kiosk에서 실패할 수 있으므로 강제 종료
    setTimeout(() => {
      console.log('[KioskGuard] Graceful quit failed, forcing process.exit(0)');
      process.exit(0);
    }, 1500);
  }

  // ── Block keyboard shortcuts via globalShortcut ─────────────────────
  const blockedShortcuts = [
    // Function keys (F12 제외 — 탈출키 조합과 간섭 방지)
    ...Array.from({ length: 11 }, (_, i) => `F${i + 1}`),
    // Ctrl combos
    'Ctrl+R', 'Ctrl+Shift+R',
    'Ctrl+Shift+I', 'Ctrl+Shift+J',
    'Ctrl+U', 'Ctrl+L', 'Ctrl+D', 'Ctrl+T', 'Ctrl+N',
    'Ctrl+W', 'Ctrl+P', 'Ctrl+S', 'Ctrl+F',
    'Ctrl+G', 'Ctrl+H', 'Ctrl+J', 'Ctrl+O',
    // Alt combos
    'Alt+F4', 'Alt+Tab', 'Alt+Shift+Tab', 'Alt+Space',
    // Zoom
    'Ctrl+Plus', 'Ctrl+=', 'Ctrl+-', 'Ctrl+0',
    // Navigation
    'Alt+Left', 'Alt+Right', 'Backspace',
    // Windows key combos
    'Super+D', 'Super+E', 'Super+R', 'Super+L', 'Super+Tab',
  ];

  for (const shortcut of blockedShortcuts) {
    try {
      globalShortcut.register(shortcut, () => {
        // Intentionally empty - swallow the shortcut
      });
    } catch (err) {
      console.warn(`[KioskGuard] Could not register shortcut: ${shortcut}`, err.message);
    }
  }

  // ── Admin escape hatch: 여러 조합 등록 (중복 안전장치) ───────────────
  const escapeShortcuts = ['Ctrl+Shift+F12', 'Ctrl+Alt+Shift+Q', 'Ctrl+Alt+Shift+D'];
  for (const shortcut of escapeShortcuts) {
    try {
      const ok = globalShortcut.register(shortcut, () => forceQuit(`globalShortcut ${shortcut}`));
      if (ok) {
        console.log(`[KioskGuard] Escape shortcut registered: ${shortcut}`);
      } else {
        console.warn(`[KioskGuard] Escape shortcut registration returned false: ${shortcut}`);
      }
    } catch (err) {
      console.warn(`[KioskGuard] Failed to register escape ${shortcut}:`, err.message);
    }
  }

  // ── Backup: before-input-event (globalShortcut 실패 시 동작) ─────────
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return;

    const isEscape =
      // Ctrl+Shift+F12
      (input.key === 'F12' && input.control && input.shift) ||
      // Ctrl+Alt+Shift+Q
      (input.key.toLowerCase() === 'q' && input.control && input.alt && input.shift) ||
      // Ctrl+Alt+Shift+D
      (input.key.toLowerCase() === 'd' && input.control && input.alt && input.shift);

    if (isEscape) {
      forceQuit('before-input-event');
    }
  });

  // ── Re-focus on blur ──────────────────────────────────────────────────
  mainWindow.on('blur', () => {
    setTimeout(() => {
      if (!app.isQuitting && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        mainWindow.moveTop();
      }
    }, 100);
  });

  // ── Cleanup on quit ─────────────────────────────────────────────────
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

module.exports = { setupKioskGuard };
