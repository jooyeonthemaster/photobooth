const { spawn, execFile, execSync } = require('child_process');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class CameraService {
  constructor() {
    // Look for digiCamControl in bundled location first, then system install
    const bundledPath = path.join(__dirname, '..', 'camera', 'digiCamControl');
    const systemPath = 'C:\\Program Files (x86)\\digiCamControl';
    this.dccPath = fs.existsSync(bundledPath) ? bundledPath : systemPath;
    this.dccExe = path.join(this.dccPath, 'CameraControl.exe');
    this.cmdExe = path.join(this.dccPath, 'CameraControlRemoteCmd.exe');
    this.captureDir = path.join(__dirname, '..', 'public', 'captures');
    this.dccProcess = null;
    this.liveViewUrl = 'http://localhost:5513/liveview.jpg';
    this.webServerUrl = 'http://localhost:5513';
    this.isReady = false;
    this.healthCheckInterval = null;
    this._registered = false;
  }

  async initialize() {
    // Ensure capture directory exists
    if (!fs.existsSync(this.captureDir)) {
      fs.mkdirSync(this.captureDir, { recursive: true });
    }

    await this.startDCC();
    this.registerIPC();
    this.startHealthCheck();
    return this;
  }

  async startDCC() {
    // Check if CameraControl.exe exists
    if (!fs.existsSync(this.dccExe)) {
      console.warn('[CameraService] CameraControl.exe not found at:', this.dccExe);
      console.warn('[CameraService] Running in degraded mode - DSLR capture will not work');
      return;
    }

    console.log('[CameraService] Starting digiCamControl from:', this.dccExe);

    // Launch CameraControl.exe with web server enabled
    this.dccProcess = spawn(this.dccExe, [], {
      cwd: this.dccPath,
      detached: false,
      stdio: 'ignore',
      windowsHide: false,
    });

    this.dccProcess.on('error', (err) => {
      console.error('[CameraService] Failed to start CameraControl.exe:', err.message);
    });

    this.dccProcess.on('exit', (code) => {
      console.log('[CameraService] CameraControl.exe exited with code:', code);
      this.isReady = false;
    });

    // Wait for the web server to become available (up to 30 seconds)
    try {
      await this.waitForWebServer(30000);
      console.log('[CameraService] Web server is ready');

      // Enable live view
      try {
        const response = await fetch(`${this.webServerUrl}/?slc=LiveViewWnd_Show`);
        if (response.ok) {
          console.log('[CameraService] Live view enabled');
        }
      } catch (err) {
        console.warn('[CameraService] Failed to enable live view:', err.message);
      }

      this.isReady = true;
    } catch (err) {
      console.error('[CameraService] Web server did not start in time:', err.message);
    }
  }

  waitForWebServer(timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const pollInterval = 500;

      const poll = async () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Timed out waiting for digiCamControl web server'));
          return;
        }

        try {
          const response = await fetch(this.webServerUrl, {
            signal: AbortSignal.timeout(2000),
          });
          if (response.ok) {
            resolve();
            return;
          }
        } catch (err) {
          // Server not ready yet, retry
        }

        setTimeout(poll, pollInterval);
      };

      poll();
    });
  }

  async captureToBase64() {
    const timestamp = Date.now();
    const filename = `capture_${timestamp}.jpg`;
    const outputPath = path.join(this.captureDir, filename);

    console.log('[CameraService] Capturing to:', outputPath);

    // Execute capture command via CameraControlRemoteCmd.exe
    return new Promise((resolve, reject) => {
      execFile(
        this.cmdExe,
        ['/c', 'capture', '/filename', outputPath],
        { cwd: this.dccPath, timeout: 15000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('[CameraService] Capture command error:', error.message);
            reject(error);
            return;
          }

          console.log('[CameraService] Capture command output:', stdout.trim());

          // Poll for the file to appear (camera may need time to write)
          const pollStart = Date.now();
          const maxWait = 10000; // 10 seconds
          const pollMs = 200;

          const waitForFile = () => {
            if (fs.existsSync(outputPath)) {
              try {
                const fileBuffer = fs.readFileSync(outputPath);
                const base64 = fileBuffer.toString('base64');
                const dataUri = `data:image/jpeg;base64,${base64}`;

                // Clean up temp file
                try {
                  fs.unlinkSync(outputPath);
                } catch (cleanupErr) {
                  console.warn('[CameraService] Failed to delete temp file:', cleanupErr.message);
                }

                console.log('[CameraService] Capture successful, base64 length:', dataUri.length);
                resolve({ success: true, image: dataUri });
              } catch (readErr) {
                reject(new Error('Failed to read captured file: ' + readErr.message));
              }
              return;
            }

            if (Date.now() - pollStart > maxWait) {
              reject(new Error('Captured file did not appear within timeout'));
              return;
            }

            setTimeout(waitForFile, pollMs);
          };

          waitForFile();
        }
      );
    });
  }

  async setSetting(setting, value) {
    try {
      const url = `${this.webServerUrl}/?slc=Set&param1=${encodeURIComponent(setting)}&param2=${encodeURIComponent(value)}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      const text = await response.text();
      console.log(`[CameraService] Set ${setting}=${value} -> ${text.trim()}`);
      return { success: response.ok, message: text.trim() };
    } catch (err) {
      console.error(`[CameraService] Failed to set ${setting}:`, err.message);
      return { success: false, message: err.message };
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      processRunning: !!(this.dccProcess && !this.dccProcess.killed),
    };
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(this.liveViewUrl, {
          signal: AbortSignal.timeout(3000),
        });
        this.isReady = response.ok;
      } catch (err) {
        this.isReady = false;
      }
    }, 5000);
  }

  registerIPC() {
    if (this._registered) return;
    this._registered = true;

    ipcMain.handle('camera:capture', async () => {
      try {
        return await this.captureToBase64();
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('camera:getLiveViewUrl', () => {
      return this.liveViewUrl;
    });

    ipcMain.handle('camera:getStatus', () => {
      return this.getStatus();
    });

    ipcMain.handle('camera:setSetting', async (_event, key, val) => {
      return await this.setSetting(key, val);
    });
  }

  shutdown() {
    console.log('[CameraService] Shutting down...');

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Kill the managed process
    if (this.dccProcess && !this.dccProcess.killed) {
      try {
        this.dccProcess.kill();
        console.log('[CameraService] DCC process killed');
      } catch (err) {
        console.warn('[CameraService] Failed to kill DCC process:', err.message);
      }
    }

    // Fallback: force kill any remaining CameraControl.exe
    try {
      execSync('taskkill /IM CameraControl.exe /F', { stdio: 'ignore' });
      console.log('[CameraService] Force-killed CameraControl.exe via taskkill');
    } catch (err) {
      // Process may not be running, that's OK
    }

    this.isReady = false;
    console.log('[CameraService] Shutdown complete');
  }
}

module.exports = { CameraService };
