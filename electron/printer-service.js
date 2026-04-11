const { ipcMain, app } = require('electron');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');

const execAsync = promisify(exec);

class PrinterService {
  constructor() {
    this._registered = false;
  }

  /**
   * Resolve DnpPrinter.exe path for both dev and packaged environments.
   */
  _findPrinterExe() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'printer-service', 'DnpPrinter.exe')]
      : [path.join(__dirname, '..', 'printer-service', 'DnpPrinter.exe')];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        console.log('[PrinterService] Found exe at:', p);
        return p;
      }
    }

    const fallback = candidates[0];
    console.warn('[PrinterService] Exe not found, fallback:', fallback);
    return fallback;
  }

  /**
   * Write base64 image to OS temp directory.
   */
  async _writeTempFile(base64Data) {
    const raw = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const tempDir = app.getPath('temp');
    const filename = `photobooth_print_${Date.now()}.jpg`;
    const tempFilePath = path.join(tempDir, filename);

    await fsPromises.writeFile(tempFilePath, raw, 'base64');
    console.log('[PrinterService] Temp file written:', tempFilePath);
    return tempFilePath;
  }

  /**
   * Delete a temp file, swallowing errors.
   */
  async _cleanupTempFile(filePath) {
    try {
      await fsPromises.unlink(filePath);
      console.log('[PrinterService] Temp file deleted:', filePath);
    } catch (err) {
      console.warn('[PrinterService] Failed to delete temp file:', err.message);
    }
  }

  /**
   * Execute a single print job.
   */
  async _executePrint(exePath, tempFilePath) {
    const command = `"${exePath}" "${tempFilePath}"`;
    console.log('[PrinterService] Executing:', command);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
    });

    console.log('[PrinterService] stdout:', stdout);
    if (stderr) {
      console.warn('[PrinterService] stderr:', stderr);
    }
    return stdout;
  }

  /**
   * Print a base64-encoded image via DnpPrinter.exe.
   */
  async printImage(base64Image, copies = 1) {
    let tempFilePath = null;

    try {
      const exePath = this._findPrinterExe();
      if (!fs.existsSync(exePath)) {
        return {
          success: false,
          message: 'DNP 프린터 서비스(DnpPrinter.exe)를 찾을 수 없습니다.',
        };
      }

      console.log(`[PrinterService] Printing ${copies} copies`);

      tempFilePath = await this._writeTempFile(base64Image);

      // Print N copies sequentially
      for (let i = 0; i < copies; i++) {
        console.log(`[PrinterService] Printing copy ${i + 1}/${copies}`);
        await this._executePrint(exePath, tempFilePath);
        if (i < copies - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // Delay cleanup to let printer finish reading the file
      setTimeout(() => this._cleanupTempFile(tempFilePath), 5000);

      return {
        success: true,
        message: `DNP 프린터로 ${copies}장 출력을 시작했습니다!`,
      };
    } catch (err) {
      console.error('[PrinterService] Print error:', err);

      if (tempFilePath) {
        await this._cleanupTempFile(tempFilePath);
      }

      let userMessage;
      if (err.killed) {
        userMessage = '프린터 응답 시간이 초과되었습니다 (30초). 프린터 상태를 확인해주세요.';
      } else {
        const detail = err.stdout?.trim() || err.stderr?.trim() || err.message;
        userMessage = '프린터 출력에 실패했습니다: ' + detail;
      }

      return {
        success: false,
        message: userMessage,
      };
    }
  }

  /**
   * Check printer availability.
   */
  async checkPrinter() {
    try {
      const exePath = this._findPrinterExe();

      if (!fs.existsSync(exePath)) {
        return {
          available: false,
          printer: 'DP-DS620',
          message: 'DNP 프린터 서비스를 찾을 수 없습니다.',
        };
      }

      return {
        available: true,
        printer: 'DP-DS620',
        message: 'DNP 프린터가 준비되었습니다.',
      };
    } catch (err) {
      return {
        available: false,
        printer: 'DP-DS620',
        message: '프린터 상태 확인 실패: ' + err.message,
      };
    }
  }

  /**
   * Register IPC handlers. Idempotent.
   */
  registerIPC() {
    if (this._registered) return;
    this._registered = true;

    ipcMain.handle('printer:print', async (_event, base64Image, copies) => {
      return await this.printImage(base64Image, copies);
    });

    ipcMain.handle('printer:check', async () => {
      return await this.checkPrinter();
    });

    console.log('[PrinterService] IPC handlers registered');
  }
}

module.exports = { PrinterService };
