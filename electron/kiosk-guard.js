const { globalShortcut } = require('electron');

/**
 * Register global shortcuts and input guards to lock down the kiosk.
 * @param {Electron.BrowserWindow} mainWindow
 * @param {Electron.App} app
 */
function setupKioskGuard(mainWindow, app) {
  // ── Block keyboard shortcuts via globalShortcut ─────────────────────
  const blockedShortcuts = [
    // Function keys
    ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
    // Ctrl combos
    'Ctrl+R', 'Ctrl+Shift+R',
    'Ctrl+Shift+I', 'Ctrl+Shift+J',
    'Ctrl+U', 'Ctrl+L', 'Ctrl+D', 'Ctrl+T', 'Ctrl+N',
    'Ctrl+W', 'Ctrl+Q', 'Ctrl+P', 'Ctrl+S', 'Ctrl+F',
    'Ctrl+G', 'Ctrl+H', 'Ctrl+J', 'Ctrl+O',
    // Alt combos
    'Alt+F4', 'Alt+Tab', 'Alt+Shift+Tab', 'Alt+Escape', 'Alt+Space',
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
      // Some shortcuts (e.g. Alt+Tab on Windows) may fail to register;
      // that is expected on certain OS versions.
      console.warn(`[KioskGuard] Could not register shortcut: ${shortcut}`, err.message);
    }
  }

  // ── Admin escape hatch: Ctrl+Shift+Alt+Escape → quit ───────────────
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (
      input.type === 'keyDown' &&
      input.key === 'Escape' &&
      input.control &&
      input.shift &&
      input.alt
    ) {
      console.log('[KioskGuard] Admin escape triggered — quitting.');
      app.isQuitting = true;
      app.quit();
    }
  });

  // ── Re-focus on blur (belt-and-suspenders with main.js handler) ─────
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
