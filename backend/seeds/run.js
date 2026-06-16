const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'betting_platform'
  });

  try {
    const adminPass = await bcrypt.hash('admin123', 10);
    const bookmakerPass = await bcrypt.hash('bookmaker123', 10);
    const playerPass = await bcrypt.hash('player123', 10);

    // Users
    await connection.query(`
      INSERT IGNORE INTO users (username, password, role, full_name, phone, balance, credit_limit) VALUES
      ('admin', ?, 'admin', 'Super Admin', '9999999999', 10000000.00, 99999999.00),
      ('bookmaker1', ?, 'bookmaker', 'Rajesh Kumar', '9876543210', 5000000.00, 50000000.00),
      ('bookmaker2', ?, 'bookmaker', 'Suresh Patel', '9876543211', 3000000.00, 30000000.00),
      ('player1', ?, 'player', 'Amit Sharma', '9876543212', 50000.00, 100000.00),
      ('player2', ?, 'player', 'Vikram Singh', '9876543213', 75000.00, 150000.00),
      ('player3', ?, 'player', 'Rahul Verma', '9876543214', 25000.00, 50000.00),
      ('player4', ?, 'player', 'Deepak Joshi', '9876543215', 100000.00, 200000.00),
      ('demo', ?, 'player', 'Demo Player', '9000000000', 100000.00, 200000.00)
    `, [adminPass, bookmakerPass, bookmakerPass, playerPass, playerPass, playerPass, playerPass, playerPass]);

    // Sports
    await connection.query(`
      INSERT IGNORE INTO sports (name, slug, icon, sort_order) VALUES
      ('Cricket', 'cricket', 'cricket', 1),
      ('Football', 'football', 'football', 2),
      ('Tennis', 'tennis', 'tennis', 3)
    `);

    // Tournaments
    await connection.query(`
      INSERT IGNORE INTO tournaments (sport_id, name, slug) VALUES
      (1, 'IPL 2026', 'ipl-2026'),
      (1, 'ICC World Cup', 'icc-world-cup'),
      (1, 'Big Bash League', 'bbl'),
      (1, 'Test Matches', 'test-matches'),
      (2, 'English Premier League', 'epl'),
      (2, 'UEFA Champions League', 'ucl'),
      (2, 'La Liga', 'la-liga'),
      (2, 'ISL', 'isl'),
      (3, 'Wimbledon', 'wimbledon'),
      (3, 'Australian Open', 'australian-open'),
      (3, 'US Open', 'us-open')
    `);

    // Cricket Events
    const now = new Date();
    const later = (h) => new Date(now.getTime() + h * 3600000).toISOString().slice(0, 19).replace('T', ' ');

    await connection.query(`
      INSERT IGNORE INTO events (sport_id, tournament_id, name, team_a, team_b, start_time, status, is_live, score_a, score_b, created_by) VALUES
      (1, 1, 'Mumbai Indians v Chennai Super Kings', 'Mumbai Indians', 'Chennai Super Kings', ?, 'live', 1, '185/4 (18.2)', '0/0', 1),
      (1, 1, 'Royal Challengers v Delhi Capitals', 'Royal Challengers', 'Delhi Capitals', ?, 'live', 1, '142/3 (15.0)', '0/0', 1),
      (1, 1, 'Kolkata Knight Riders v Rajasthan Royals', 'Kolkata Knight Riders', 'Rajasthan Royals', ?, 'upcoming', 0, '0', '0', 1),
      (1, 2, 'India v Australia', 'India', 'Australia', ?, 'upcoming', 0, '0', '0', 1),
      (1, 2, 'England v South Africa', 'England', 'South Africa', ?, 'upcoming', 0, '0', '0', 1),
      (2, 5, 'Manchester United v Liverpool', 'Manchester United', 'Liverpool', ?, 'live', 1, '1', '2', 1),
      (2, 5, 'Arsenal v Chelsea', 'Arsenal', 'Chelsea', ?, 'upcoming', 0, '0', '0', 1),
      (2, 6, 'Real Madrid v Barcelona', 'Real Madrid', 'Barcelona', ?, 'upcoming', 0, '0', '0', 1),
      (3, 9, 'Djokovic v Alcaraz', 'N. Djokovic', 'C. Alcaraz', ?, 'live', 1, '6-4, 3-5', '', 1),
      (3, 9, 'Sinner v Medvedev', 'J. Sinner', 'D. Medvedev', ?, 'upcoming', 0, '0', '0', 1)
    `, [
      later(-1), later(-0.5), later(3), later(24), later(48),
      later(-0.75), later(5), later(28),
      later(-1.5), later(6)
    ]);

    // Markets for each event
    const [events] = await connection.query('SELECT id, sport_id FROM events');
    for (const event of events) {
      // Match Odds market
      await connection.query(`
        INSERT INTO markets (event_id, name, market_type, status, min_bet, max_bet) VALUES
        (?, 'Match Odds', 'match_odds', 'open', 100, 500000)
      `, [event.id]);

      // Bookmaker market
      await connection.query(`
        INSERT INTO markets (event_id, name, market_type, status, min_bet, max_bet) VALUES
        (?, 'Bookmaker', 'bookmaker', 'open', 100, 200000)
      `, [event.id]);

      if (event.sport_id === 1) {
        // Fancy markets for cricket
        await connection.query(`
          INSERT INTO markets (event_id, name, market_type, status, min_bet, max_bet) VALUES
          (?, '1st Innings Total Runs', 'fancy', 'open', 100, 100000),
          (?, 'Total Sixes', 'fancy', 'open', 100, 50000),
          (?, 'Top Batsman Runs', 'fancy', 'open', 100, 50000)
        `, [event.id, event.id, event.id]);
      }
    }

    // Runners for Match Odds markets
    const [matchOddsMarkets] = await connection.query(`
      SELECT m.id, e.team_a, e.team_b, e.sport_id
      FROM markets m JOIN events e ON m.event_id = e.id
      WHERE m.market_type = 'match_odds'
    `);

    for (const market of matchOddsMarkets) {
      const backA = (1.5 + Math.random() * 1.5).toFixed(2);
      const layA = (parseFloat(backA) + 0.02 + Math.random() * 0.05).toFixed(2);
      const backB = (1.5 + Math.random() * 1.5).toFixed(2);
      const layB = (parseFloat(backB) + 0.02 + Math.random() * 0.05).toFixed(2);

      await connection.query(`
        INSERT INTO runners (market_id, name, sort_order, back_price, lay_price, back_size, lay_size) VALUES
        (?, ?, 1, ?, ?, ?, ?),
        (?, ?, 2, ?, ?, ?, ?)
      `, [
        market.id, market.team_a, backA, layA, (50000 + Math.random() * 200000).toFixed(0), (30000 + Math.random() * 150000).toFixed(0),
        market.id, market.team_b, backB, layB, (50000 + Math.random() * 200000).toFixed(0), (30000 + Math.random() * 150000).toFixed(0)
      ]);

      if (market.sport_id === 2) {
        // Draw option for football
        await connection.query(`
          INSERT INTO runners (market_id, name, sort_order, back_price, lay_price, back_size, lay_size) VALUES
          (?, 'The Draw', 3, ?, ?, ?, ?)
        `, [market.id, (3.0 + Math.random() * 2).toFixed(2), (3.5 + Math.random() * 2).toFixed(2), (20000 + Math.random() * 100000).toFixed(0), (15000 + Math.random() * 80000).toFixed(0)]);
      }
    }

    // Runners for Bookmaker markets
    const [bookmakerMarkets] = await connection.query(`
      SELECT m.id, e.team_a, e.team_b
      FROM markets m JOIN events e ON m.event_id = e.id
      WHERE m.market_type = 'bookmaker'
    `);

    for (const market of bookmakerMarkets) {
      const priceA = (40 + Math.random() * 30).toFixed(0);
      const priceB = (100 - parseFloat(priceA) - 5 + Math.random() * 10).toFixed(0);
      await connection.query(`
        INSERT INTO runners (market_id, name, sort_order, back_price, lay_price, back_size, lay_size) VALUES
        (?, ?, 1, ?, ?, ?, ?),
        (?, ?, 2, ?, ?, ?, ?)
      `, [
        market.id, market.team_a, priceA, (parseFloat(priceA) + 2).toFixed(0), (100000 + Math.random() * 400000).toFixed(0), (80000 + Math.random() * 300000).toFixed(0),
        market.id, market.team_b, priceB, (parseFloat(priceB) + 2).toFixed(0), (100000 + Math.random() * 400000).toFixed(0), (80000 + Math.random() * 300000).toFixed(0)
      ]);
    }

    // Fancy market runners
    const [fancyMarkets] = await connection.query(`
      SELECT id, name FROM markets WHERE market_type = 'fancy'
    `);

    for (const market of fancyMarkets) {
      let val;
      if (market.name.includes('Total Runs')) val = 160 + Math.floor(Math.random() * 40);
      else if (market.name.includes('Sixes')) val = 8 + Math.floor(Math.random() * 8);
      else val = 30 + Math.floor(Math.random() * 20);

      await connection.query(`
        INSERT INTO runners (market_id, name, sort_order, back_price, lay_price, back_size, lay_size) VALUES
        (?, ?, 1, ?, ?, ?, ?)
      `, [market.id, market.name, val, val + 2, (50000 + Math.random() * 100000).toFixed(0), (40000 + Math.random() * 80000).toFixed(0)]);
    }

    // Casino Games
    await connection.query(`
      INSERT IGNORE INTO casino_games (name, slug, category, provider, is_active, min_bet, max_bet, sort_order) VALUES
      ('Teen Patti', 'teen-patti', 'indian_games', 'In-House', 1, 10, 100000, 1),
      ('Andar Bahar', 'andar-bahar', 'indian_games', 'In-House', 1, 10, 100000, 2),
      ('Lucky 7', 'lucky-7', 'live_casino', 'In-House', 1, 10, 50000, 3),
      ('Dragon Tiger', 'dragon-tiger', 'live_casino', 'In-House', 1, 10, 50000, 4),
      ('32 Cards', 'thirty-two-cards', 'indian_games', 'In-House', 1, 10, 100000, 5),
      ('Roulette', 'roulette', 'table_games', 'In-House', 1, 10, 200000, 6),
      ('Baccarat', 'baccarat', 'table_games', 'In-House', 1, 50, 500000, 7),
      ('Hi-Lo', 'hi-lo', 'live_casino', 'In-House', 1, 10, 50000, 8),
      ('Crash', 'crash', 'crash', 'In-House', 1, 10, 100000, 9),
      ('Bollywood Casino', 'bollywood-casino', 'indian_games', 'In-House', 1, 10, 50000, 10)
    `);

    // Settings
    await connection.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
      ('site_name', 'BettingPro'),
      ('site_tagline', 'India\\'s #1 Betting Exchange'),
      ('min_deposit', '500'),
      ('max_deposit', '1000000'),
      ('min_withdrawal', '1000'),
      ('max_withdrawal', '500000'),
      ('default_commission', '2'),
      ('maintenance_mode', '0'),
      ('marquee_text', 'Welcome to BettingPro - Live Cricket, Football & Tennis Betting | Casino Games Available 24/7'),
      ('whatsapp_number', '919999999999'),
      ('telegram_link', 'https://t.me/bettingpro'),
      ('support_hours', '24/7')
    `);

    // Announcements
    await connection.query(`
      INSERT IGNORE INTO announcements (title, message, type, is_active, created_by) VALUES
      ('Welcome to BettingPro!', 'India\\'s most trusted betting exchange. Enjoy live cricket, football, tennis and casino games!', 'info', 1, 1),
      ('IPL 2026 Special', 'Get extra 5% bonus on all IPL match deposits. Limited time offer!', 'info', 1, 1)
    `);

    // Sample bets for demo
    await connection.query(`
      INSERT IGNORE INTO bets (user_id, event_id, market_id, runner_id, bet_type, odds, stake, potential_profit, potential_loss, status) VALUES
      (4, 1, 1, 1, 'back', 1.85, 5000, 4250, 5000, 'matched'),
      (4, 1, 1, 2, 'lay', 2.10, 3000, 3000, 3300, 'matched'),
      (5, 1, 1, 1, 'back', 1.82, 10000, 8200, 10000, 'matched'),
      (6, 6, 11, 21, 'back', 2.50, 2000, 3000, 2000, 'matched'),
      (7, 9, 17, 33, 'lay', 1.65, 8000, 8000, 5200, 'matched')
    `);

    // Sample transactions
    await connection.query(`
      INSERT IGNORE INTO transactions (user_id, type, amount, balance_after, description) VALUES
      (4, 'deposit', 50000, 50000, 'Initial deposit'),
      (4, 'bet_placed', -5000, 45000, 'Bet on MI v CSK - Match Odds'),
      (5, 'deposit', 75000, 75000, 'Initial deposit'),
      (5, 'bet_placed', -10000, 65000, 'Bet on MI v CSK - Match Odds'),
      (6, 'deposit', 25000, 25000, 'Initial deposit'),
      (7, 'deposit', 100000, 100000, 'Initial deposit')
    `);

    console.log('Seed data inserted successfully!');
    console.log('\\nLogin Credentials:');
    console.log('==================');
    console.log('Admin:     admin / admin123');
    console.log('Bookmaker: bookmaker1 / bookmaker123');
    console.log('Player:    player1 / player123');
    console.log('Demo:      demo / player123');

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
