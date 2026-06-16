require('dotenv').config();

const dbEngine = process.env.DB_ENGINE || 'sqlite';

if (dbEngine === 'mysql') {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'betting_platform',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
  });
  pool.getConnection().then(conn => { console.log('MySQL connected'); conn.release(); }).catch(err => console.error('MySQL failed:', err.message));
  module.exports = pool;
} else {
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'betting.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  function adaptSQL(sql) {
    return sql
      .replace(/INSERT IGNORE INTO/gi, 'INSERT OR IGNORE INTO')
      .replace(/ON DUPLICATE KEY UPDATE .+$/gim, '')
      .replace(/ FOR UPDATE/gi, '')
      .replace(/COALESCE\(SUM\((\w+)\),\s*0\)/gi, 'COALESCE(SUM($1), 0)')
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
      .replace(/IFNULL/gi, 'IFNULL');
  }

  function expandArrayParams(sql, params) {
    if (!params || !params.length) return { sql, params };
    let newSql = sql;
    let newParams = [];
    let paramIdx = 0;

    for (let i = 0; i < params.length; i++) {
      if (Array.isArray(params[i])) {
        const placeholders = params[i].map(() => '?').join(',');
        newSql = newSql.replace('?', placeholders);
        newParams.push(...params[i]);
      } else {
        newParams.push(params[i]);
      }
    }
    return { sql: newSql, params: newParams };
  }

  const pool = {
    query: async (sql, params = []) => {
      try {
        let adaptedSql = adaptSQL(sql);
        const expanded = expandArrayParams(adaptedSql, Array.isArray(params) ? params : [params]);
        adaptedSql = expanded.sql;
        const finalParams = expanded.params;

        const trimmed = adaptedSql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('SHOW') || trimmed.startsWith('WITH')) {
          const rows = db.prepare(adaptedSql).all(...finalParams);
          return [rows];
        } else if (trimmed.startsWith('INSERT')) {
          // Handle ON DUPLICATE KEY UPDATE -> use INSERT OR REPLACE
          if (sql.toUpperCase().includes('ON DUPLICATE KEY UPDATE')) {
            adaptedSql = adaptedSql.replace(/^INSERT/i, 'INSERT OR REPLACE');
          }
          try {
            const info = db.prepare(adaptedSql).run(...finalParams);
            return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }];
          } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || String(err).includes('UNIQUE constraint')) {
              return [{ insertId: 0, affectedRows: 0 }];
            }
            throw err;
          }
        } else {
          const info = db.prepare(adaptedSql).run(...finalParams);
          return [{ affectedRows: info.changes }];
        }
      } catch (err) {
        if (String(err).includes('UNIQUE constraint')) {
          return [{ insertId: 0, affectedRows: 0 }];
        }
        console.error('SQLite query error:', err.message, '\nSQL:', sql.substring(0, 200));
        throw err;
      }
    },
    getConnection: async () => {
      return {
        query: async (sql, params) => pool.query(sql, params),
        beginTransaction: async () => { try { db.exec('BEGIN'); } catch(e) {} },
        commit: async () => { try { db.exec('COMMIT'); } catch(e) {} },
        rollback: async () => { try { db.exec('ROLLBACK'); } catch(e) {} },
        release: () => {}
      };
    },
    raw: db
  };

  console.log('SQLite database connected:', dbPath);
  module.exports = pool;
}
