// Canon EDSDK FFI Bindings via koffi
// Reference: cannon edsdk/Windows/sample/CSharp/CameraControl/CameraControl/EDSDK.cs

const koffi = require('koffi');
const path = require('path');

// ── Error Codes ──────────────────────────────────────────────────────
const EDS_ERR_OK = 0x00000000;
const EDS_ERR_DEVICE_BUSY = 0x00000081;
const EDS_ERR_DEVICE_NOT_FOUND = 0x00000080;
const EDS_ERR_DEVICE_EMERGENCY = 0x00000083;
const EDS_ERR_DEVICE_MEMORY_FULL = 0x00000084;
const EDS_ERR_DEVICE_INTERNAL_ERROR = 0x00000085;
const EDS_ERR_SESSION_NOT_OPEN = 0x00002003;
const EDS_ERR_INCOMPLETE_TRANSFER = 0x00002007;
const EDS_ERR_INVALID_PARAMETER = 0x00000060;
const EDS_ERR_FILE_NOT_FOUND = 0x00000022;
const EDS_ERR_STREAM_NOT_OPEN = 0x000000A1;
const EDS_ERR_OBJECT_NOTREADY = 0x0000A102;
const EDS_ERR_LOW_BATTERY = 0x0000A101;

// ── Property IDs ─────────────────────────────────────────────────────
const PropID_SaveTo = 0x0000000b;
const PropID_Evf_OutputDevice = 0x00000500;
const PropID_Evf_Mode = 0x00000501;

// ── Camera Commands ──────────────────────────────────────────────────
const CameraCommand_TakePicture = 0x00000000;
const CameraCommand_ExtendShutDownTimer = 0x00000001;
const CameraCommand_BulbStart = 0x00000002;
const CameraCommand_BulbEnd = 0x00000003;
const CameraCommand_PressShutterButton = 0x00000004;
const CameraCommand_DoEvfAf = 0x00000102;

// ── Camera State Commands ────────────────────────────────────────────
const CameraState_UILock = 0x00000000;
const CameraState_UIUnLock = 0x00000001;

// ── SaveTo ───────────────────────────────────────────────────────────
const EdsSaveTo_Camera = 1;
const EdsSaveTo_Host = 2;
const EdsSaveTo_Both = 3;

// ── EVF Output Device ────────────────────────────────────────────────
const EvfOutputDevice_TFT = 0x01;
const EvfOutputDevice_PC = 0x02;
const EvfOutputDevice_PC_Small = 0x08;

// ── ShutterButton ────────────────────────────────────────────────────
const ShutterButton_OFF = 0x00000000;
const ShutterButton_Halfway = 0x00000001;
const ShutterButton_Completely = 0x00000003;
const ShutterButton_Halfway_NonAF = 0x00010001;
const ShutterButton_Completely_NonAF = 0x00010003;

// ── Object Events ────────────────────────────────────────────────────
const ObjectEvent_All = 0x00000200;
const ObjectEvent_DirItemCreated = 0x00000204;
const ObjectEvent_DirItemRemoved = 0x00000205;
const ObjectEvent_DirItemRequestTransfer = 0x00000208;

// ── State Events ─────────────────────────────────────────────────────
const StateEvent_All = 0x00000300;
const StateEvent_Shutdown = 0x00000301;
const StateEvent_WillSoonShutDown = 0x00000303;
const StateEvent_ShutDownTimerUpdate = 0x00000304;
const StateEvent_CaptureError = 0x00000305;

// ── Property Events ──────────────────────────────────────────────────
const PropertyEvent_All = 0x00000100;

// ── Stream ───────────────────────────────────────────────────────────
const FileCreateDisposition_CreateNew = 0;
const FileCreateDisposition_CreateAlways = 1;
const FileCreateDisposition_OpenExisting = 2;
const FileCreateDisposition_OpenAlways = 3;

const Access_Read = 0;
const Access_Write = 1;
const Access_ReadWrite = 2;

// ── Struct Definitions ───────────────────────────────────────────────

// EdsDeviceInfo: LayoutKind.Sequential, string fields are ByValTStr SizeConst=256
const EdsDeviceInfo = koffi.struct('EdsDeviceInfo', {
  szPortName: koffi.array('char', 256),
  szDeviceDescription: koffi.array('char', 256),
  DeviceSubType: 'uint32',
  reserved: 'uint32',
});

// EdsCapacity: Pack=2 in C#
// With Pack=2: {int32, int32, int32} = 12 bytes (no padding needed since all fields are 4 bytes)
// Pack=2 doesn't change layout here, but we define it for correctness
const EdsCapacity = koffi.struct('EdsCapacity', {
  NumberOfFreeClusters: 'int32',
  BytesPerSector: 'int32',
  Reset: 'int32',
});

// EdsDirectoryItemInfo: LayoutKind.Sequential
const EdsDirectoryItemInfo = koffi.struct('EdsDirectoryItemInfo', {
  Size: 'uint64',
  isFolder: 'int32',
  GroupID: 'uint32',
  Option: 'uint32',
  szFileName: koffi.array('char', 256),
  format: 'uint32',
  dateTime: 'uint32',
});

const EdsPoint = koffi.struct('EdsPoint', {
  x: 'int32',
  y: 'int32',
});

const EdsRect = koffi.struct('EdsRect', {
  x: 'int32',
  y: 'int32',
  width: 'int32',
  height: 'int32',
});

const EdsSize = koffi.struct('EdsSize', {
  width: 'int32',
  height: 'int32',
});

// ── Callback Prototypes ──────────────────────────────────────────────
// EdsObjectEventHandler: uint callback(uint inEvent, IntPtr inRef, IntPtr inContext)
const EdsObjectEventHandler = koffi.proto('uint32 EdsObjectEventHandler(uint32 inEvent, void* inRef, void* inContext)');

// EdsStateEventHandler: uint callback(uint inEvent, uint inParameter, IntPtr inContext)
const EdsStateEventHandler = koffi.proto('uint32 EdsStateEventHandler(uint32 inEvent, uint32 inParameter, void* inContext)');

// EdsPropertyEventHandler: uint callback(uint inEvent, uint inPropertyID, uint inParam, IntPtr inContext)
const EdsPropertyEventHandler = koffi.proto('uint32 EdsPropertyEventHandler(uint32 inEvent, uint32 inPropertyID, uint32 inParam, void* inContext)');

// EdsCameraAddedHandler: uint callback(IntPtr inContext)
const EdsCameraAddedHandler = koffi.proto('uint32 EdsCameraAddedHandler(void* inContext)');

// ── DLL Loading & Function Declarations ──────────────────────────────

let _lib = null;
let _edsImageLib = null;
let _funcs = null;

function getDllDir() {
  // electron main process
  try {
    const { app } = require('electron');
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'edsdk-dlls');
    }
  } catch (e) {
    // Not in Electron context
  }
  // Development: relative to this file (electron/edsdk/bindings.js)
  return path.join(__dirname, '..', '..', 'edsdk-dlls');
}

function load() {
  if (_funcs) return _funcs;

  const dllDir = getDllDir();
  console.log('[EDSDK] Loading DLLs from:', dllDir);

  // EdsImage.dll must be loaded first (dependency of EDSDK.dll)
  _edsImageLib = koffi.load(path.join(dllDir, 'EdsImage.dll'));
  _lib = koffi.load(path.join(dllDir, 'EDSDK.dll'));

  _funcs = {
    // ── Initialization ──
    EdsInitializeSDK: _lib.func('uint32 EdsInitializeSDK()'),
    EdsTerminateSDK: _lib.func('uint32 EdsTerminateSDK()'),

    // ── Camera List ──
    EdsGetCameraList: _lib.func('uint32 EdsGetCameraList(_Out_ void** outCameraListRef)'),
    EdsGetChildCount: _lib.func('uint32 EdsGetChildCount(void* inRef, _Out_ int32* outCount)'),
    EdsGetChildAtIndex: _lib.func('uint32 EdsGetChildAtIndex(void* inRef, int32 inIndex, _Out_ void** outRef)'),

    // ── Session ──
    EdsOpenSession: _lib.func('uint32 EdsOpenSession(void* inCameraRef)'),
    EdsCloseSession: _lib.func('uint32 EdsCloseSession(void* inCameraRef)'),

    // ── Device Info ──
    EdsGetDeviceInfo: _lib.func('uint32 EdsGetDeviceInfo(void* inCameraRef, _Out_ EdsDeviceInfo* outDeviceInfo)'),

    // ── Properties ──
    // For setting simple uint32 properties, pass Buffer with the value
    EdsSetPropertyData: _lib.func('uint32 EdsSetPropertyData(void* inRef, uint32 inPropertyID, int32 inParam, int32 inPropertySize, void* inPropertyData)'),
    EdsGetPropertyData: _lib.func('uint32 EdsGetPropertyData(void* inRef, uint32 inPropertyID, int32 inParam, int32 inPropertySize, void* outPropertyData)'),

    // ── Capacity ──
    EdsSetCapacity: _lib.func('uint32 EdsSetCapacity(void* inCameraRef, EdsCapacity inCapacity)'),

    // ── Commands ──
    EdsSendCommand: _lib.func('uint32 EdsSendCommand(void* inCameraRef, uint32 inCommand, int32 inParam)'),
    EdsSendStatusCommand: _lib.func('uint32 EdsSendStatusCommand(void* inCameraRef, uint32 inCameraState, int32 inParam)'),

    // ── Streams ──
    EdsCreateMemoryStream: _lib.func('uint32 EdsCreateMemoryStream(uint64 inBufferSize, _Out_ void** outStream)'),
    EdsCreateFileStream: _lib.func('uint32 EdsCreateFileStream(str inFileName, uint32 inCreateDisposition, uint32 inDesiredAccess, _Out_ void** outStream)'),
    EdsGetPointer: _lib.func('uint32 EdsGetPointer(void* inStreamRef, _Out_ void** outPointer)'),
    EdsGetLength: _lib.func('uint32 EdsGetLength(void* inStreamRef, _Out_ uint64* outLength)'),

    // ── EVF (Live View) ──
    EdsCreateEvfImageRef: _lib.func('uint32 EdsCreateEvfImageRef(void* inStreamRef, _Out_ void** outEvfImageRef)'),
    EdsDownloadEvfImage: _lib.func('uint32 EdsDownloadEvfImage(void* inCameraRef, void* outEvfImageRef)'),

    // ── File Download ──
    EdsGetDirectoryItemInfo: _lib.func('uint32 EdsGetDirectoryItemInfo(void* inDirItemRef, _Out_ EdsDirectoryItemInfo* outDirItemInfo)'),
    EdsDownload: _lib.func('uint32 EdsDownload(void* inDirItemRef, uint64 inReadSize, void* outStream)'),
    EdsDownloadComplete: _lib.func('uint32 EdsDownloadComplete(void* inDirItemRef)'),
    EdsDownloadCancel: _lib.func('uint32 EdsDownloadCancel(void* inDirItemRef)'),

    // ── Event Handlers ──
    EdsSetObjectEventHandler: _lib.func('uint32 EdsSetObjectEventHandler(void* inCameraRef, uint32 inEvent, EdsObjectEventHandler* inObjectEventHandler, void* inContext)'),
    EdsSetCameraStateEventHandler: _lib.func('uint32 EdsSetCameraStateEventHandler(void* inCameraRef, uint32 inEvent, EdsStateEventHandler* inStateEventHandler, void* inContext)'),
    EdsSetPropertyEventHandler: _lib.func('uint32 EdsSetPropertyEventHandler(void* inCameraRef, uint32 inEvent, EdsPropertyEventHandler* inPropertyEventHandler, void* inContext)'),

    // ── Reference Management ──
    EdsRelease: _lib.func('uint32 EdsRelease(void* inRef)'),
    EdsRetain: _lib.func('uint32 EdsRetain(void* inRef)'),
  };

  return _funcs;
}

function unload() {
  _funcs = null;
  // koffi doesn't have explicit unload, but we clear references
  _lib = null;
  _edsImageLib = null;
}

function errorToString(err) {
  const codes = {
    [EDS_ERR_OK]: 'OK',
    [EDS_ERR_DEVICE_BUSY]: 'DEVICE_BUSY',
    [EDS_ERR_DEVICE_NOT_FOUND]: 'DEVICE_NOT_FOUND',
    [EDS_ERR_DEVICE_EMERGENCY]: 'DEVICE_EMERGENCY',
    [EDS_ERR_DEVICE_MEMORY_FULL]: 'DEVICE_MEMORY_FULL',
    [EDS_ERR_DEVICE_INTERNAL_ERROR]: 'DEVICE_INTERNAL_ERROR',
    [EDS_ERR_SESSION_NOT_OPEN]: 'SESSION_NOT_OPEN',
    [EDS_ERR_INCOMPLETE_TRANSFER]: 'INCOMPLETE_TRANSFER',
    [EDS_ERR_INVALID_PARAMETER]: 'INVALID_PARAMETER',
    [EDS_ERR_FILE_NOT_FOUND]: 'FILE_NOT_FOUND',
    [EDS_ERR_STREAM_NOT_OPEN]: 'STREAM_NOT_OPEN',
    [EDS_ERR_OBJECT_NOTREADY]: 'OBJECT_NOTREADY',
    [EDS_ERR_LOW_BATTERY]: 'LOW_BATTERY',
  };
  return codes[err] || `UNKNOWN(0x${err.toString(16)})`;
}

module.exports = {
  // Functions
  load,
  unload,
  errorToString,

  // Structs
  EdsDeviceInfo,
  EdsCapacity,
  EdsDirectoryItemInfo,
  EdsPoint,
  EdsRect,
  EdsSize,

  // Callback types
  EdsObjectEventHandler,
  EdsStateEventHandler,
  EdsPropertyEventHandler,
  EdsCameraAddedHandler,

  // Error codes
  EDS_ERR_OK,
  EDS_ERR_DEVICE_BUSY,
  EDS_ERR_DEVICE_NOT_FOUND,
  EDS_ERR_DEVICE_EMERGENCY,
  EDS_ERR_DEVICE_MEMORY_FULL,
  EDS_ERR_DEVICE_INTERNAL_ERROR,
  EDS_ERR_SESSION_NOT_OPEN,
  EDS_ERR_INCOMPLETE_TRANSFER,
  EDS_ERR_INVALID_PARAMETER,
  EDS_ERR_FILE_NOT_FOUND,
  EDS_ERR_STREAM_NOT_OPEN,
  EDS_ERR_OBJECT_NOTREADY,
  EDS_ERR_LOW_BATTERY,

  // Property IDs
  PropID_SaveTo,
  PropID_Evf_OutputDevice,
  PropID_Evf_Mode,

  // Commands
  CameraCommand_TakePicture,
  CameraCommand_ExtendShutDownTimer,
  CameraCommand_BulbStart,
  CameraCommand_BulbEnd,
  CameraCommand_PressShutterButton,
  CameraCommand_DoEvfAf,

  // Camera States
  CameraState_UILock,
  CameraState_UIUnLock,

  // SaveTo
  EdsSaveTo_Camera,
  EdsSaveTo_Host,
  EdsSaveTo_Both,

  // EVF Output
  EvfOutputDevice_TFT,
  EvfOutputDevice_PC,
  EvfOutputDevice_PC_Small,

  // ShutterButton
  ShutterButton_OFF,
  ShutterButton_Halfway,
  ShutterButton_Completely,
  ShutterButton_Halfway_NonAF,
  ShutterButton_Completely_NonAF,

  // Object Events
  ObjectEvent_All,
  ObjectEvent_DirItemCreated,
  ObjectEvent_DirItemRemoved,
  ObjectEvent_DirItemRequestTransfer,

  // State Events
  StateEvent_All,
  StateEvent_Shutdown,
  StateEvent_WillSoonShutDown,
  StateEvent_ShutDownTimerUpdate,
  StateEvent_CaptureError,

  // Property Events
  PropertyEvent_All,

  // Stream constants
  FileCreateDisposition_CreateNew,
  FileCreateDisposition_CreateAlways,
  FileCreateDisposition_OpenExisting,
  FileCreateDisposition_OpenAlways,
  Access_Read,
  Access_Write,
  Access_ReadWrite,
};
