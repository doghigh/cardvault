const { app, BrowserWindow } = require('electron');
const express = require('express');

const server = express();
const PORT = process.env.PORT || 3000;

server.get('/', (req, res) => {
    res.send('Hello, World! The server is running.');
});

server.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadURL('http://localhost:' + PORT);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});