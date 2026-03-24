const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    isElectron: true,
  },
  camera: {
    getMode: () => ipcRenderer.invoke('camera:getMode'),
    capture: () => ipcRenderer.invoke('camera:capture'),
    getStatus: () => ipcRenderer.invoke('camera:getStatus'),
    onEvfFrame: (callback) => {
      ipcRenderer.on('camera:evf-frame', (_event, base64Jpeg) => callback(base64Jpeg));
    },
    offEvfFrame: () => {
      ipcRenderer.removeAllListeners('camera:evf-frame');
    },
    onModeChanged: (callback) => {
      ipcRenderer.on('camera:mode-changed', (_event, mode) => callback(mode));
    },
  },
  printImage: (base64Image) => ipcRenderer.invoke('printer:print', base64Image),
  checkPrinter: () => ipcRenderer.invoke('printer:check'),
});
