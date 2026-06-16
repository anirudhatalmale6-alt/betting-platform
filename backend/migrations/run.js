const mysql = require('mysql2/promise');
require('dotenv').config();

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'bookmaker', 'player') NOT NULL DEFAULT 'player',
  full_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  balance DECIMAL(15,2) DEFAULT 0.00,
  exposure DECIMAL(15,2) DEFAULT 0.00,
  credit_limit DECIMAL(15,2) DEFAULT 100000.00,
  commission_rate DECIMAL(5,2) DEFAULT 2.00,
  status ENUM('active', 'suspended', 'blocked') DEFAULT 'active',
  parent_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tournaments/Leagues
CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sport_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
  INDEX idx_sport (sport_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Events/Matches
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sport_id INT NOT NULL,
  tournament_id INT,
  name VARCHAR(200) NOT NULL,
  team_a VARCHAR(100) NOT NULL,
  team_b VARCHAR(100) NOT NULL,
  start_time DATETIME NOT NULL,
  status ENUM('upcoming', 'live', 'suspended', 'completed', 'cancelled') DEFAULT 'upcoming',
  is_live TINYINT(1) DEFAULT 0,
  score_a VARCHAR(50) DEFAULT '0',
  score_b VARCHAR(50) DEFAULT '0',
  result VARCHAR(200),
  tv_channel VARCHAR(50),
  created_by INT,
  settled TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  INDEX idx_status (status),
  INDEX idx_live (is_live),
  INDEX idx_start (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Markets (Match Odds, Bookmaker, Fancy etc.)
CREATE TABLE IF NOT EXISTS markets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  market_type ENUM('match_odds', 'bookmaker', 'fancy', 'over_under', 'casino') DEFAULT 'match_odds',
  status ENUM('open', 'suspended', 'closed', 'settled') DEFAULT 'open',
  min_bet DECIMAL(10,2) DEFAULT 100.00,
  max_bet DECIMAL(10,2) DEFAULT 500000.00,
  bet_delay INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_type (market_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Runners/Selections within a market
CREATE TABLE IF NOT EXISTS runners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  market_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  back_price DECIMAL(10,2) DEFAULT 0.00,
  lay_price DECIMAL(10,2) DEFAULT 0.00,
  back_size DECIMAL(15,2) DEFAULT 0.00,
  lay_size DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('active', 'suspended', 'winner', 'loser') DEFAULT 'active',
  result ENUM('pending', 'won', 'lost') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
  INDEX idx_market (market_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bets
CREATE TABLE IF NOT EXISTS bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  market_id INT NOT NULL,
  runner_id INT NOT NULL,
  bet_type ENUM('back', 'lay') NOT NULL,
  odds DECIMAL(10,2) NOT NULL,
  stake DECIMAL(15,2) NOT NULL,
  potential_profit DECIMAL(15,2) NOT NULL,
  potential_loss DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'matched', 'settled', 'cancelled', 'void') DEFAULT 'pending',
  result ENUM('pending', 'won', 'lost', 'void') DEFAULT 'pending',
  profit_loss DECIMAL(15,2) DEFAULT 0.00,
  ip_address VARCHAR(45),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (market_id) REFERENCES markets(id),
  FOREIGN KEY (runner_id) REFERENCES runners(id),
  INDEX idx_user (user_id),
  INDEX idx_event (event_id),
  INDEX idx_market (market_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transactions (wallet)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'bet_void', 'commission', 'adjustment', 'transfer') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  reference_id INT,
  reference_type VARCHAR(50),
  description VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Casino Games
CREATE TABLE IF NOT EXISTS casino_games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  category ENUM('live_casino', 'slots', 'table_games', 'indian_games', 'crash') DEFAULT 'live_casino',
  provider VARCHAR(100),
  thumbnail VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  min_bet DECIMAL(10,2) DEFAULT 10.00,
  max_bet DECIMAL(10,2) DEFAULT 100000.00,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Casino Rounds
CREATE TABLE IF NOT EXISTS casino_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  round_number VARCHAR(50),
  status ENUM('open', 'closed', 'settled') DEFAULT 'open',
  result JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP NULL,
  FOREIGN KEY (game_id) REFERENCES casino_games(id),
  INDEX idx_game (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Casino Bets
CREATE TABLE IF NOT EXISTS casino_bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_id INT NOT NULL,
  round_id INT,
  bet_option VARCHAR(50) NOT NULL,
  stake DECIMAL(15,2) NOT NULL,
  odds DECIMAL(10,2) DEFAULT 2.00,
  status ENUM('pending', 'won', 'lost', 'void') DEFAULT 'pending',
  profit_loss DECIMAL(15,2) DEFAULT 0.00,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES casino_games(id),
  INDEX idx_user (user_id),
  INDEX idx_game (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'urgent') DEFAULT 'info',
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    await connection.query(\`CREATE DATABASE IF NOT EXISTS \${process.env.DB_NAME || 'betting_platform'}\`);
    await connection.query(\`USE \${process.env.DB_NAME || 'betting_platform'}\`);

    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await connection.query(stmt);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
