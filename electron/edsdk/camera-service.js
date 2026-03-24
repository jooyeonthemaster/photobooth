// Canon EDSDK Camera Service
// Handles camera initialization, live view streaming, and photo capture

const { EventEmitter } = require('events');
const koffi = require('koffi');
const bindings = require('./bindings');

const {
  EDS_ERR_OK, EDS_ERR_DEVICE_BUSY, EDS_ERR_OBJECT_NOTREADY,
  PropID_SaveTo, PropID_Evf_OutputDevice, PropID_Evf_Mode,
  EdsSaveTo_Host, EvfOutputDevice_PC,
  CameraCommand_PressShutterButton, CameraCommand_ExtendShutDownTimer,
  ShutterButton_OFF, ShutterButton_Completely,
  ObjectEvent_All, ObjectEvent_DirItemRequestTransfer,
  StateEvent_All, StateEvent_Shutdown, StateEvent_WillSoonShutDown,
  PropertyEvent_All,
  EdsDeviceInfo, EdsCapacity, EdsDirectoryItemInfo,
  EdsObjectEventHandler, EdsStateEventHandler, EdsPropertyEventHandler,
  errorToString,
} = bindings;

const EVF_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB for EVF frame
const EVF_POLL_INTERVAL = 50; // ms between EVF frame polls
const CAPTURE_TIMEOUT = 15000; // 15s capture timeout
const KEEPALIVE_INTERVAL = 60000; // 60s keep-alive

class EdsdkCameraService extends EventEmitter {
  constructor() {
    super();
    this._eds = null; // EDSDK function bindings
    this._camera = null;
    this._cameraList = null;
    this._isConnected = false;
    this._isLiveViewActive = false;
    this._evfTimeoutId = null;
    this._capturePromise = null;
    this._mainWindow = null;
    this._keepAliveInterval = null;
    this._cameraModel = '';

    // Must hold references to prevent GC of registered callbacks
    this._objectCallback = null;
    this._stateCallback = null;
    this._propertyCallback = null;
  }

  get isConnected() { return this._isConnected; }
  get isLiveViewActive() { return this._isLiveViewActive; }
  get cameraModel() { return this._cameraModel; }

  async initialize(mainWindow) {
    this._mainWindow = mainWindow;

    // Load EDSDK DLL bindings
    this._eds = bindings.load();

    // 1. Initialize SDK
    let err = this._eds.EdsInitializeSDK();
    if (err !== EDS_ERR_OK) {
      try { this._eds.EdsTerminateSDK(); } catch (e) { /* ignore */ }
      this._eds = null;
      throw new Error(`EdsInitializeSDK failed: ${errorToString(err)}`);
    }
    console.log('[EDSDK] SDK initialized');

    // 2. Get camera list
    const cameraListRef = [null];
    err = this._eds.EdsGetCameraList(cameraListRef);
    if (err !== EDS_ERR_OK) {
      this._eds.EdsTerminateSDK();
      throw new Error(`EdsGetCameraList failed: ${errorToString(err)}`);
    }
    this._cameraList = cameraListRef[0];

    // 3. Check camera count
    const countRef = [0];
    err = this._eds.EdsGetChildCount(this._cameraList, countRef);
    if (err !== EDS_ERR_OK || countRef[0] === 0) {
      this._eds.EdsRelease(this._cameraList);
      this._eds.EdsTerminateSDK();
      throw new Error('No Canon camera detected via USB');
    }
    console.log(`[EDSDK] Found ${countRef[0]} camera(s)`);

    // 4. Get first camera
    const cameraRef = [null];
    err = this._eds.EdsGetChildAtIndex(this._cameraList, 0, cameraRef);
    if (err !== EDS_ERR_OK) {
      this._eds.EdsRelease(this._cameraList);
      this._eds.EdsTerminateSDK();
      throw new Error(`EdsGetChildAtIndex failed: ${errorToString(err)}`);
    }
    this._camera = cameraRef[0];

    // 5. Get device info
    const deviceInfo = {};
    err = this._eds.EdsGetDeviceInfo(this._camera, deviceInfo);
    if (err === EDS_ERR_OK) {
      // Extract null-terminated string from char array
      const descBytes = deviceInfo.szDeviceDescription;
      this._cameraModel = String.fromCharCode(...descBytes).replace(/\0.*$/, '');
      console.log(`[EDSDK] Camera: ${this._cameraModel}`);
    }

    // 6. Register event handlers BEFORE opening session
    this._registerEventHandlers();

    // 7. Open session
    err = this._eds.EdsOpenSession(this._camera);
    if (err !== EDS_ERR_OK) {
      this._eds.EdsRelease(this._camera);
      this._eds.EdsRelease(this._cameraList);
      this._eds.EdsTerminateSDK();
      throw new Error(`EdsOpenSession failed: ${errorToString(err)}`);
    }
    console.log('[EDSDK] Session opened');

    // 8. Set SaveTo = Host (PC download, not camera card)
    this._setPropertyUint32(PropID_SaveTo, EdsSaveTo_Host);

    // 9. Set fake capacity so camera doesn't complain about full disk
    err = this._eds.EdsSetCapacity(this._camera, {
      NumberOfFreeClusters: 0x7FFFFFFF,
      BytesPerSector: 0x1000,
      Reset: 1,
    });
    if (err !== EDS_ERR_OK) {
      console.warn(`[EDSDK] EdsSetCapacity warning: ${errorToString(err)}`);
    }

    this._isConnected = true;
    this._startKeepAlive();
    console.log('[EDSDK] Camera ready');
  }

  _setPropertyUint32(propId, value) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value);
    const err = this._eds.EdsSetPropertyData(this._camera, propId, 0, 4, buf);
    if (err !== EDS_ERR_OK) {
      console.warn(`[EDSDK] SetProperty 0x${propId.toString(16)} warning: ${errorToString(err)}`);
    }
    return err;
  }

  _registerEventHandlers() {
    // Object event handler (for capture download)
    this._objectCallback = koffi.register((event, ref, context) => {
      if (event === ObjectEvent_DirItemRequestTransfer) {
        this._handleDownload(ref);
      }
      return EDS_ERR_OK;
    }, koffi.pointer(EdsObjectEventHandler));

    this._eds.EdsSetObjectEventHandler(
      this._camera, ObjectEvent_All, this._objectCallback, null
    );

    // State event handler (disconnect, shutdown warning)
    this._stateCallback = koffi.register((event, param, context) => {
      if (event === StateEvent_Shutdown) {
        console.log('[EDSDK] Camera disconnected (StateEvent_Shutdown)');
        this._isConnected = false;
        this.stopLiveView();
        this.emit('disconnected');
      } else if (event === StateEvent_WillSoonShutDown) {
        // Extend auto-shutdown timer
        if (this._camera && this._isConnected) {
          this._eds.EdsSendCommand(this._camera, CameraCommand_ExtendShutDownTimer, 0);
        }
      }
      return EDS_ERR_OK;
    }, koffi.pointer(EdsStateEventHandler));

    this._eds.EdsSetCameraStateEventHandler(
      this._camera, StateEvent_All, this._stateCallback, null
    );

    // Property event handler (optional, for monitoring property changes)
    this._propertyCallback = koffi.register((event, propertyID, param, context) => {
      return EDS_ERR_OK;
    }, koffi.pointer(EdsPropertyEventHandler));

    this._eds.EdsSetPropertyEventHandler(
      this._camera, PropertyEvent_All, this._propertyCallback, null
    );
  }

  // ── Live View ──────────────────────────────────────────────────────

  startLiveView() {
    if (this._isLiveViewActive) return;
    if (!this._isConnected || !this._camera) return;

    // Enable EVF mode
    this._setPropertyUint32(PropID_Evf_Mode, 1);

    // Set output device to PC
    this._setPropertyUint32(PropID_Evf_OutputDevice, EvfOutputDevice_PC);

    this._isLiveViewActive = true;
    console.log('[EDSDK] Live view started');

    // Start self-scheduling frame poll (not setInterval, to prevent backpressure)
    this._scheduleNextEvfFrame();
  }

  stopLiveView() {
    this._isLiveViewActive = false;

    if (this._evfTimeoutId) {
      clearTimeout(this._evfTimeoutId);
      this._evfTimeoutId = null;
    }

    if (this._isConnected && this._camera) {
      // Disable EVF output
      this._setPropertyUint32(PropID_Evf_OutputDevice, 0);
    }

    console.log('[EDSDK] Live view stopped');
  }

  _scheduleNextEvfFrame() {
    if (!this._isLiveViewActive) return;

    this._evfTimeoutId = setTimeout(() => {
      this._downloadEvfFrame();
      this._scheduleNextEvfFrame();
    }, EVF_POLL_INTERVAL);
  }

  _downloadEvfFrame() {
    if (!this._isLiveViewActive || !this._camera || !this._isConnected) return;

    let streamRef = null;
    let evfImageRef = null;

    try {
      // Create memory stream for EVF frame
      const streamOut = [null];
      let err = this._eds.EdsCreateMemoryStream(EVF_BUFFER_SIZE, streamOut);
      if (err !== EDS_ERR_OK) return;
      streamRef = streamOut[0];

      // Create EVF image reference
      const evfOut = [null];
      err = this._eds.EdsCreateEvfImageRef(streamRef, evfOut);
      if (err !== EDS_ERR_OK) {
        this._eds.EdsRelease(streamRef);
        return;
      }
      evfImageRef = evfOut[0];

      // Download EVF image
      err = this._eds.EdsDownloadEvfImage(this._camera, evfImageRef);
      if (err !== EDS_ERR_OK) {
        // OBJECT_NOTREADY or DEVICE_BUSY is normal during transitions - just skip
        this._eds.EdsRelease(evfImageRef);
        this._eds.EdsRelease(streamRef);
        return;
      }

      // Get JPEG data pointer and length
      const ptrOut = [null];
      const lenOut = [BigInt(0)];
      this._eds.EdsGetPointer(streamRef, ptrOut);
      this._eds.EdsGetLength(streamRef, lenOut);

      const jpegLength = Number(lenOut[0]);
      if (jpegLength > 0 && ptrOut[0]) {
        // Read JPEG bytes from native memory
        const jpegBuffer = Buffer.from(
          koffi.decode(ptrOut[0], koffi.array('uint8', jpegLength))
        );

        // Send to renderer as base64
        if (this._mainWindow && !this._mainWindow.isDestroyed()) {
          this._mainWindow.webContents.send('camera:evf-frame', jpegBuffer.toString('base64'));
        }
      }
    } catch (err) {
      // Silently skip frame on error
    } finally {
      if (evfImageRef) this._eds.EdsRelease(evfImageRef);
      if (streamRef) this._eds.EdsRelease(streamRef);
    }
  }

  // ── Capture ────────────────────────────────────────────────────────

  async capture() {
    if (!this._isConnected || !this._camera) {
      throw new Error('Camera not connected');
    }

    // Pause live view during capture
    const wasLiveView = this._isLiveViewActive;
    if (wasLiveView) {
      if (this._evfTimeoutId) {
        clearTimeout(this._evfTimeoutId);
        this._evfTimeoutId = null;
      }
    }

    try {
      const result = await this._captureInternal();
      return result;
    } finally {
      // Resume live view
      if (wasLiveView && this._isLiveViewActive) {
        this._scheduleNextEvfFrame();
      }
    }
  }

  _captureInternal() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._capturePromise = null;
        reject(new Error('Capture timeout: no transfer event within 15s'));
      }, CAPTURE_TIMEOUT);

      this._capturePromise = { resolve, reject, timeout };

      // Press shutter completely, then release
      let err = this._eds.EdsSendCommand(
        this._camera, CameraCommand_PressShutterButton, ShutterButton_Completely
      );

      // Release shutter button
      this._eds.EdsSendCommand(
        this._camera, CameraCommand_PressShutterButton, ShutterButton_OFF
      );

      if (err !== EDS_ERR_OK && err !== EDS_ERR_DEVICE_BUSY) {
        clearTimeout(timeout);
        this._capturePromise = null;
        reject(new Error(`TakePicture failed: ${errorToString(err)}`));
      }
      // If DEVICE_BUSY, promise stays pending - callback will fire or timeout
    });
  }

  _handleDownload(dirItemRef) {
    if (!this._capturePromise) {
      // Unexpected transfer - cancel it
      try {
        this._eds.EdsDownloadCancel(dirItemRef);
        this._eds.EdsRelease(dirItemRef);
      } catch (e) { /* ignore */ }
      return;
    }

    const { resolve, reject, timeout } = this._capturePromise;
    this._capturePromise = null;
    clearTimeout(timeout);

    let streamRef = null;

    try {
      // Get file info
      const dirItemInfo = {};
      let err = this._eds.EdsGetDirectoryItemInfo(dirItemRef, dirItemInfo);
      if (err !== EDS_ERR_OK) throw new Error(`EdsGetDirectoryItemInfo: ${errorToString(err)}`);

      const fileSize = Number(dirItemInfo.Size);
      console.log(`[EDSDK] Downloading image: ${fileSize} bytes`);

      // Create memory stream
      const streamOut = [null];
      err = this._eds.EdsCreateMemoryStream(BigInt(fileSize), streamOut);
      if (err !== EDS_ERR_OK) throw new Error(`EdsCreateMemoryStream: ${errorToString(err)}`);
      streamRef = streamOut[0];

      // Download
      err = this._eds.EdsDownload(dirItemRef, BigInt(fileSize), streamRef);
      if (err !== EDS_ERR_OK) throw new Error(`EdsDownload: ${errorToString(err)}`);

      err = this._eds.EdsDownloadComplete(dirItemRef);
      if (err !== EDS_ERR_OK) {
        console.warn(`[EDSDK] EdsDownloadComplete warning: ${errorToString(err)}`);
      }

      // Extract JPEG buffer from memory stream
      const ptrOut = [null];
      const lenOut = [BigInt(0)];
      this._eds.EdsGetPointer(streamRef, ptrOut);
      this._eds.EdsGetLength(streamRef, lenOut);

      const imageLength = Number(lenOut[0]);
      const imageBuffer = Buffer.from(
        koffi.decode(ptrOut[0], koffi.array('uint8', imageLength))
      );

      // Return as base64 data URI
      const base64 = imageBuffer.toString('base64');
      console.log(`[EDSDK] Capture complete: ${imageLength} bytes`);
      resolve(`data:image/jpeg;base64,${base64}`);
    } catch (err) {
      reject(err);
    } finally {
      if (streamRef) this._eds.EdsRelease(streamRef);
      try { this._eds.EdsRelease(dirItemRef); } catch (e) { /* ignore */ }
    }
  }

  // ── Keep-Alive ─────────────────────────────────────────────────────

  _startKeepAlive() {
    this._keepAliveInterval = setInterval(() => {
      if (this._isConnected && this._camera) {
        this._eds.EdsSendCommand(this._camera, CameraCommand_ExtendShutDownTimer, 0);
      }
    }, KEEPALIVE_INTERVAL);
  }

  // ── Shutdown ───────────────────────────────────────────────────────

  shutdown() {
    console.log('[EDSDK] Shutting down...');

    this._isLiveViewActive = false;

    if (this._evfTimeoutId) {
      clearTimeout(this._evfTimeoutId);
      this._evfTimeoutId = null;
    }

    if (this._keepAliveInterval) {
      clearInterval(this._keepAliveInterval);
      this._keepAliveInterval = null;
    }

    if (this._capturePromise) {
      clearTimeout(this._capturePromise.timeout);
      this._capturePromise.reject(new Error('Camera service shutdown'));
      this._capturePromise = null;
    }

    if (this._eds && this._camera) {
      try {
        // Disable EVF
        this._setPropertyUint32(PropID_Evf_OutputDevice, 0);
      } catch (e) { /* ignore */ }

      try {
        this._eds.EdsCloseSession(this._camera);
      } catch (e) { /* ignore */ }

      try {
        this._eds.EdsRelease(this._camera);
      } catch (e) { /* ignore */ }
    }

    if (this._eds && this._cameraList) {
      try {
        this._eds.EdsRelease(this._cameraList);
      } catch (e) { /* ignore */ }
    }

    if (this._eds) {
      try {
        this._eds.EdsTerminateSDK();
      } catch (e) { /* ignore */ }
    }

    this._camera = null;
    this._cameraList = null;
    this._isConnected = false;

    console.log('[EDSDK] Shutdown complete');
  }
}

module.exports = { EdsdkCameraService };
