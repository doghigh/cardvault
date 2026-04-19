// ipc-handlers.js

const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// File System Operations
ipcMain.handle('fs:read', async (event, filePath) => {
    try {
        const data = fs.readFileSync(path.resolve(filePath), 'utf-8');
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('fs:write', async (event, filePath, content) => {
    try {
        fs.writeFileSync(path.resolve(filePath), content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('fs:delete', async (event, filePath) => {
    try {
        fs.unlinkSync(path.resolve(filePath));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Notifications
ipcMain.handle('notify', async (event, title, body) => {
    const notification = new Notification({
        title,
        body
    });
    notification.show();
});

// Ready for Database Handlers
// Placeholder for database related IPC handlers

// ipcMain.handle('db:query', async (event, query) => {
//     // Implement database querying logic here
// });

// ipcMain.handle('db:insert', async (event, data) => {
//     // Implement database insertion logic here
// });