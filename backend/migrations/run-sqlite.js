const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'betting.db');

// Remove existing DB for fresh start
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('admin','bookmaker','player')),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  balance REAL DEFAULT 0.00,
  exposure REAL DEFAULT 0.00,
  credit_limit REAL DEFAULT 100000.00,
  commission_rate REAL DEFAULT 2.00,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','blocked')),
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

CREATE TABLE IF NOT EXISTS sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_id INTEGER NOT NULL,
  tournament_id INTEGER,
  name TEXT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','live','suspended','completed','cancelled')),
  is_live INTEGER DEFAULT 0,
  score_a TEXT DEFAULT '0',
  score_b TEXT DEFAULT '0',
  result TEXT,
  tv_channel TEXT,
  created_by INTEGER,
  settled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  market_type TEXT DEFAULT 'match_odds' CHECK(market_type IN ('match_odds','bookmaker','fancy','over_under','casino')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open','suspended','closed','settled')),
  min_bet REAL DEFAULT 100.00,
  max_bet REAL DEFAULT 500000.00,
  bet_delay INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  back_price REAL DEFAULT 0.00,
  lay_price REAL DEFAULT 0.00,
  back_size REAL DEFAULT 0.00,
  lay_size REAL DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','winner','loser')),
  result TEXT DEFAULT 'pending' CHECK(result IN ('pending','won','lost')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  market_id INTEGER NOT NULL,
  runner_id INTEGER NOT NULL,
  bet_type TEXT NOT NULL CHECK(bet_type IN ('back','lay')),
  odds REAL NOT NULL,
  stake REAL NOT NULL,
  potential_profit REAL NOT NULL,
  potential_loss REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','matched','settled','cancelled','void')),
  result TEXT DEFAULT 'pending' CHECK(result IN ('pending','won','lost','void')),
  profit_loss REAL DEFAULT 0.00,
  ip_address TEXT,
  placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (market_id) REFERENCES markets(id),
  FOREIGN KEY (runner_id) REFERENCES runners(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  reference_id INTEGER,
  reference_type TEXT,
  description TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS casino_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'live_casino',
  provider TEXT,
  thumbnail TEXT,
  is_active INTEGER DEFAULT 1,
  min_bet REAL DEFAULT 10.00,
  max_bet REAL DEFAULT 100000.00,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS casino_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  round_number TEXT,
  status TEXT DEFAULT 'open',
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME,
  FOREIGN KEY (game_id) REFERENCES casino_games(id)
);

CREATE TABLE IF NOT EXISTS casino_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  round_id INTEGER,
  bet_option TEXT NOT NULL,
  stake REAL NOT NULL,
  odds REAL DEFAULT 2.00,
  status TEXT DEFAULT 'pending',
  profit_loss REAL DEFAULT 0.00,
  placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES casino_games(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);
`;

try {
  db.exec(schema);
  console.log('SQLite migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

db.close();
