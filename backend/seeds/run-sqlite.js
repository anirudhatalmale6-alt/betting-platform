const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'betting.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function seed() {
  const adminPass = bcrypt.hashSync('admin123', 10);
  const bookmakerPass = bcrypt.hashSync('bookmaker123', 10);
  const playerPass = bcrypt.hashSync('player123', 10);

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, full_name, phone, balance, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertUser.run('admin', adminPass, 'admin', 'Super Admin', '9999999999', 10000000, 99999999);
  insertUser.run('bookmaker1', bookmakerPass, 'bookmaker', 'Rajesh Kumar', '9876543210', 5000000, 50000000);
  insertUser.run('bookmaker2', bookmakerPass, 'bookmaker', 'Suresh Patel', '9876543211', 3000000, 30000000);
  insertUser.run('player1', playerPass, 'player', 'Amit Sharma', '9876543212', 50000, 100000);
  insertUser.run('player2', playerPass, 'player', 'Vikram Singh', '9876543213', 75000, 150000);
  insertUser.run('player3', playerPass, 'player', 'Rahul Verma', '9876543214', 25000, 50000);
  insertUser.run('player4', playerPass, 'player', 'Deepak Joshi', '9876543215', 100000, 200000);
  insertUser.run('demo', playerPass, 'player', 'Demo Player', '9000000000', 100000, 200000);

  const insertSport = db.prepare('INSERT OR IGNORE INTO sports (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)');
  insertSport.run('Cricket', 'cricket', 'cricket', 1);
  insertSport.run('Football', 'football', 'football', 2);
  insertSport.run('Tennis', 'tennis', 'tennis', 3);

  const insertTournament = db.prepare('INSERT OR IGNORE INTO tournaments (sport_id, name, slug) VALUES (?, ?, ?)');
  insertTournament.run(1, 'IPL 2026', 'ipl-2026');
  insertTournament.run(1, 'ICC World Cup', 'icc-world-cup');
  insertTournament.run(1, 'Big Bash League', 'bbl');
  insertTournament.run(1, 'Test Matches', 'test-matches');
  insertTournament.run(2, 'English Premier League', 'epl');
  insertTournament.run(2, 'UEFA Champions League', 'ucl');
  insertTournament.run(2, 'La Liga', 'la-liga');
  insertTournament.run(2, 'ISL', 'isl');
  insertTournament.run(3, 'Wimbledon', 'wimbledon');
  insertTournament.run(3, 'Australian Open', 'australian-open');
  insertTournament.run(3, 'US Open', 'us-open');

  const now = new Date();
  const later = (h) => new Date(now.getTime() + h * 3600000).toISOString().slice(0, 19).replace('T', ' ');

  const insertEvent = db.prepare('INSERT INTO events (sport_id, tournament_id, name, team_a, team_b, start_time, status, is_live, score_a, score_b, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertEvent.run(1, 1, 'Mumbai Indians v Chennai Super Kings', 'Mumbai Indians', 'Chennai Super Kings', later(-1), 'live', 1, '185/4 (18.2)', '0/0', 1);
  insertEvent.run(1, 1, 'Royal Challengers v Delhi Capitals', 'Royal Challengers', 'Delhi Capitals', later(-0.5), 'live', 1, '142/3 (15.0)', '0/0', 1);
  insertEvent.run(1, 1, 'Kolkata Knight Riders v Rajasthan Royals', 'Kolkata Knight Riders', 'Rajasthan Royals', later(3), 'upcoming', 0, '0', '0', 1);
  insertEvent.run(1, 2, 'India v Australia', 'India', 'Australia', later(24), 'upcoming', 0, '0', '0', 1);
  insertEvent.run(1, 2, 'England v South Africa', 'England', 'South Africa', later(48), 'upcoming', 0, '0', '0', 1);
  insertEvent.run(2, 5, 'Manchester United v Liverpool', 'Manchester United', 'Liverpool', later(-0.75), 'live', 1, '1', '2', 1);
  insertEvent.run(2, 5, 'Arsenal v Chelsea', 'Arsenal', 'Chelsea', later(5), 'upcoming', 0, '0', '0', 1);
  insertEvent.run(2, 6, 'Real Madrid v Barcelona', 'Real Madrid', 'Barcelona', later(28), 'upcoming', 0, '0', '0', 1);
  insertEvent.run(3, 9, 'Djokovic v Alcaraz', 'N. Djokovic', 'C. Alcaraz', later(-1.5), 'live', 1, '6-4, 3-5', '', 1);
  insertEvent.run(3, 9, 'Sinner v Medvedev', 'J. Sinner', 'D. Medvedev', later(6), 'upcoming', 0, '0', '0', 1);

  // Markets for each event
  const events = db.prepare('SELECT id, sport_id FROM events').all();
  const insertMarket = db.prepare('INSERT INTO markets (event_id, name, market_type, status, min_bet, max_bet) VALUES (?, ?, ?, ?, ?, ?)');
  const insertRunner = db.prepare('INSERT INTO runners (market_id, name, sort_order, back_price, lay_price, back_size, lay_size) VALUES (?, ?, ?, ?, ?, ?, ?)');

  for (const event of events) {
    // Match Odds
    const moInfo = insertMarket.run(event.id, 'Match Odds', 'match_odds', 'open', 100, 500000);
    const moId = Number(moInfo.lastInsertRowid);

    // Bookmaker
    const bmInfo = insertMarket.run(event.id, 'Bookmaker', 'bookmaker', 'open', 100, 200000);
    const bmId = Number(bmInfo.lastInsertRowid);

    // Get event details for runners
    const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);

    // Match Odds runners
    const backA = (1.5 + Math.random() * 1.5).toFixed(2);
    const layA = (parseFloat(backA) + 0.02 + Math.random() * 0.05).toFixed(2);
    const backB = (1.5 + Math.random() * 1.5).toFixed(2);
    const layB = (parseFloat(backB) + 0.02 + Math.random() * 0.05).toFixed(2);

    insertRunner.run(moId, ev.team_a, 1, backA, layA, Math.floor(50000 + Math.random() * 200000), Math.floor(30000 + Math.random() * 150000));
    insertRunner.run(moId, ev.team_b, 2, backB, layB, Math.floor(50000 + Math.random() * 200000), Math.floor(30000 + Math.random() * 150000));

    if (event.sport_id === 2) {
      insertRunner.run(moId, 'The Draw', 3, (3.0 + Math.random() * 2).toFixed(2), (3.5 + Math.random() * 2).toFixed(2), Math.floor(20000 + Math.random() * 100000), Math.floor(15000 + Math.random() * 80000));
    }

    // Bookmaker runners
    const priceA = Math.floor(40 + Math.random() * 30);
    const priceB = Math.floor(100 - priceA - 5 + Math.random() * 10);
    insertRunner.run(bmId, ev.team_a, 1, priceA, priceA + 2, Math.floor(100000 + Math.random() * 400000), Math.floor(80000 + Math.random() * 300000));
    insertRunner.run(bmId, ev.team_b, 2, priceB, priceB + 2, Math.floor(100000 + Math.random() * 400000), Math.floor(80000 + Math.random() * 300000));

    // Fancy for cricket
    if (event.sport_id === 1) {
      const f1 = insertMarket.run(event.id, '1st Innings Total Runs', 'fancy', 'open', 100, 100000);
      const f2 = insertMarket.run(event.id, 'Total Sixes', 'fancy', 'open', 100, 50000);
      const f3 = insertMarket.run(event.id, 'Top Batsman Runs', 'fancy', 'open', 100, 50000);

      const val1 = 160 + Math.floor(Math.random() * 40);
      const val2 = 8 + Math.floor(Math.random() * 8);
      const val3 = 30 + Math.floor(Math.random() * 20);

      insertRunner.run(Number(f1.lastInsertRowid), '1st Innings Total Runs', 1, val1, val1 + 2, Math.floor(50000 + Math.random() * 100000), Math.floor(40000 + Math.random() * 80000));
      insertRunner.run(Number(f2.lastInsertRowid), 'Total Sixes', 1, val2, val2 + 2, Math.floor(50000 + Math.random() * 100000), Math.floor(40000 + Math.random() * 80000));
      insertRunner.run(Number(f3.lastInsertRowid), 'Top Batsman Runs', 1, val3, val3 + 2, Math.floor(50000 + Math.random() * 100000), Math.floor(40000 + Math.random() * 80000));
    }
  }

  // Casino Games
  const insertGame = db.prepare('INSERT OR IGNORE INTO casino_games (name, slug, category, provider, is_active, min_bet, max_bet, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertGame.run('Teen Patti', 'teen-patti', 'indian_games', 'In-House', 1, 10, 100000, 1);
  insertGame.run('Andar Bahar', 'andar-bahar', 'indian_games', 'In-House', 1, 10, 100000, 2);
  insertGame.run('Lucky 7', 'lucky-7', 'live_casino', 'In-House', 1, 10, 50000, 3);
  insertGame.run('Dragon Tiger', 'dragon-tiger', 'live_casino', 'In-House', 1, 10, 50000, 4);
  insertGame.run('32 Cards', 'thirty-two-cards', 'indian_games', 'In-House', 1, 10, 100000, 5);
  insertGame.run('Roulette', 'roulette', 'table_games', 'In-House', 1, 10, 200000, 6);
  insertGame.run('Baccarat', 'baccarat', 'table_games', 'In-House', 1, 50, 500000, 7);
  insertGame.run('Hi-Lo', 'hi-lo', 'live_casino', 'In-House', 1, 10, 50000, 8);
  insertGame.run('Crash', 'crash', 'crash', 'In-House', 1, 10, 100000, 9);
  insertGame.run('Bollywood Casino', 'bollywood-casino', 'indian_games', 'In-House', 1, 10, 50000, 10);

  // Settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)');
  insertSetting.run('site_name', 'BettingPro');
  insertSetting.run('site_tagline', "India's #1 Betting Exchange");
  insertSetting.run('min_deposit', '500');
  insertSetting.run('max_deposit', '1000000');
  insertSetting.run('min_withdrawal', '1000');
  insertSetting.run('max_withdrawal', '500000');
  insertSetting.run('default_commission', '2');
  insertSetting.run('maintenance_mode', '0');
  insertSetting.run('marquee_text', 'Welcome to BettingPro - Live Cricket, Football & Tennis Betting | Casino Games Available 24/7');
  insertSetting.run('whatsapp_number', '919999999999');
  insertSetting.run('telegram_link', 'https://t.me/bettingpro');
  insertSetting.run('support_hours', '24/7');

  // Announcements
  const insertAnn = db.prepare('INSERT OR IGNORE INTO announcements (title, message, type, is_active, created_by) VALUES (?, ?, ?, ?, ?)');
  insertAnn.run('Welcome to BettingPro!', "India's most trusted betting exchange. Enjoy live cricket, football, tennis and casino games!", 'info', 1, 1);
  insertAnn.run('IPL 2026 Special', 'Get extra 5% bonus on all IPL match deposits. Limited time offer!', 'info', 1, 1);

  // Sample bets
  const insertBet = db.prepare('INSERT INTO bets (user_id, event_id, market_id, runner_id, bet_type, odds, stake, potential_profit, potential_loss, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertBet.run(4, 1, 1, 1, 'back', 1.85, 5000, 4250, 5000, 'matched');
  insertBet.run(4, 1, 1, 2, 'lay', 2.10, 3000, 3000, 3300, 'matched');
  insertBet.run(5, 1, 1, 1, 'back', 1.82, 10000, 8200, 10000, 'matched');
  insertBet.run(6, 6, 11, 21, 'back', 2.50, 2000, 3000, 2000, 'matched');

  // Transactions
  const insertTxn = db.prepare('INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)');
  insertTxn.run(4, 'deposit', 50000, 50000, 'Initial deposit');
  insertTxn.run(4, 'bet_placed', -5000, 45000, 'Bet on MI v CSK - Match Odds');
  insertTxn.run(5, 'deposit', 75000, 75000, 'Initial deposit');
  insertTxn.run(5, 'bet_placed', -10000, 65000, 'Bet on MI v CSK - Match Odds');
  insertTxn.run(6, 'deposit', 25000, 25000, 'Initial deposit');
  insertTxn.run(7, 'deposit', 100000, 100000, 'Initial deposit');

  console.log('Seed data inserted successfully!');
  console.log('');
  console.log('Login Credentials:');
  console.log('==================');
  console.log('Admin:     admin / admin123');
  console.log('Bookmaker: bookmaker1 / bookmaker123');
  console.log('Player:    player1 / player123');
  console.log('Demo:      demo / player123');
}

try {
  seed();
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exit(1);
}

db.close();
