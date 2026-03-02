const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  camera: {
    capture: () => ipcRenderer.invoke('camera:capture'),
    getLiveViewUrl: () => ipcRenderer.invoke('camera:getLiveViewUrl'),
    getStatus: () => ipcRenderer.invoke('camera:getStatus'),
    setSetting: (key, value) => ipcRenderer.invoke('camera:setSetting', key, value),
  },
  app: {
    isElectron: true,
  },
});
