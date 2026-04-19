// ipc-handlers.js

const { ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

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

// DATABASE HELPERS AND HANDLERS
const getDb = () => {
    const dbPath = path.join(app.getPath('userData'), 'cardvault.sqlite');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      );
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    return db;
};

// Handler: Create User
ipcMain.handle('users:create', async (event, { username, password }) => {
    const db = getDb();
    try {
        const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        const result = stmt.run(username, password);
        return { success: true, userId: result.lastInsertRowid };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        db.close();
    }
});

// Handler: Get All Users
ipcMain.handle('users:all', async () => {
    const db = getDb();
    try {
        const users = db.prepare("SELECT id, username FROM users").all();
        return { success: true, users };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        db.close();
    }
});

// Handler: Create Card
ipcMain.handle('cards:create', async (event, { user_id, title, description }) => {
    const db = getDb();
    try {
        const stmt = db.prepare("INSERT INTO cards (user_id, title, description) VALUES (?, ?, ?)");
        const result = stmt.run(user_id, title, description);
        return { success: true, cardId: result.lastInsertRowid };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        db.close();
    }
});

// Handler: Get Cards for User
ipcMain.handle('cards:byUser', async (event, user_id) => {
    const db = getDb();
    try {
        const cards = db.prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC").all(user_id);
        return { success: true, cards };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        db.close();
    }
});