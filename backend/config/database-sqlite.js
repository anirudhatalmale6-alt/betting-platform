const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'betting.db');
const fs = require('fs');
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Wrapper to mimic mysql2/promise pool interface
const pool = {
  query: async (sql, params = []) => {
    try {
      const stmt = sql.trim().toUpperCase();
      if (stmt.startsWith('SELECT') || stmt.startsWith('SHOW') || stmt.startsWith('WITH')) {
        const rows = db.prepare(sql).all(...(Array.isArray(params) ? params : [params]));
        return [rows];
      } else if (stmt.startsWith('INSERT')) {
        const info = db.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
        return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
      } else {
        const info = db.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
        return [{ affectedRows: info.changes }];
      }
    } catch (err) {
      // Handle INSERT IGNORE by catching unique constraint errors
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return [{ insertId: 0, affectedRows: 0 }];
      }
      throw err;
    }
  },
  getConnection: async () => {
    return {
      query: async (sql, params = []) => pool.query(sql, params),
      beginTransaction: async () => db.exec('BEGIN'),
      commit: async () => db.exec('COMMIT'),
      rollback: async () => { try { db.exec('ROLLBACK'); } catch(e) {} },
      release: () => {}
    };
  },
  raw: db
};

console.log('SQLite database connected:', dbPath);

module.exports = pool;
