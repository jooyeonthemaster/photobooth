// Camera Service Orchestrator
// EDSDK (Canon direct) as primary, getUserMedia (webcam) as dev/fallback

const { ipcMain } = require('electron');
const { EdsdkCameraService } = require('./edsdk/camera-service');

class CameraService {
  constructor() {
    this._edsdk = new EdsdkCameraService();
    this._mode = 'none'; // 'edsdk' | 'webcam' | 'none'
    this._registered = false;
    this._mainWindow = null;
  }

  async initialize(mainWindow) {
    this._mainWindow = mainWindow;

    try {
      await this._edsdk.initialize(mainWindow);
      this._edsdk.startLiveView();
      this._mode = 'edsdk';
      console.log('[CameraService] EDSDK mode active -', this._edsdk.cameraModel);
    } catch (err) {
      console.warn('[CameraService] EDSDK init failed, falling back to webcam:', err.message);
      this._mode = 'webcam';
    }

    // Listen for camera disconnect
    this._edsdk.on('disconnected', () => {
      console.log('[CameraService] Camera disconnected, switching to webcam mode');
      this._mode = 'webcam';
      if (this._mainWindow && !this._mainWindow.isDestroyed()) {
        this._mainWindow.webContents.send('camera:mode-changed', 'webcam');
      }
    });

    this.registerIPC();
  }

  registerIPC() {
    if (this._registered) return;
    this._registered = true;

    ipcMain.handle('camera:getMode', () => this._mode);

    ipcMain.handle('camera:capture', async () => {
      if (this._mode !== 'edsdk') {
        return { success: false, error: 'EDSDK not active, use webcam capture' };
      }
      try {
        const image = await this._edsdk.capture();
        return { success: true, image };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('camera:getStatus', () => ({
      mode: this._mode,
      isConnected: this._edsdk.isConnected,
      isLiveViewActive: this._edsdk.isLiveViewActive,
      cameraModel: this._edsdk.cameraModel,
    }));
  }

  shutdown() {
    this._edsdk.shutdown();
  }
}

module.exports = { CameraService };
