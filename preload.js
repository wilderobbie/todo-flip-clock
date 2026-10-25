const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('todoAPI', {
  minimize: () => ipcRenderer.invoke('win:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('win:toggleMaximize'),
  close: () => ipcRenderer.invoke('win:close'),
  onMaximized: cb => ipcRenderer.on('win:maximized', (_e, v) => cb(v))
})
