const { contextBridge, ipcRenderer } = require('electron');

// Exposing safe APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    // File system operations
    readFile: (path) => ipcRenderer.invoke('file-system:read', path),
    writeFile: (path, data) => ipcRenderer.invoke('file-system:write', path, data),

    // Camera operations
    startCamera: () => ipcRenderer.invoke('camera:start'),
    stopCamera: () => ipcRenderer.invoke('camera:stop'),

    // Card image operations
    uploadCardImage: (imageData) => ipcRenderer.invoke('card-image:upload', imageData),

    // Notification operations
    showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),

    // Database operations
    fetchData: (query) => ipcRenderer.invoke('database:fetch', query),
    saveData: (data) => ipcRenderer.invoke('database:save', data)
});
