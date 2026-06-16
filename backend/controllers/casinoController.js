const db = require('../config/database');

exports.getGames = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM casino_games WHERE is_active = 1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY sort_order';
    const [games] = await db.query(query, params);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.placeCasinoBet = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { game_id, bet_option, stake, odds } = req.body;
    const userId = req.user.id;

    const [games] = await conn.query('SELECT * FROM casino_games WHERE id = ? AND is_active = 1', [game_id]);
    if (!games.length) return res.status(404).json({ error: 'Game not found' });

    const game = games[0];
    const stakeNum = parseFloat(stake);
    if (stakeNum < parseFloat(game.min_bet)) return res.status(400).json({ error: `Minimum bet is ${game.min_bet}` });
    if (stakeNum > parseFloat(game.max_bet)) return res.status(400).json({ error: `Maximum bet is ${game.max_bet}` });

    const [users] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (parseFloat(users[0].balance) < stakeNum) return res.status(400).json({ error: 'Insufficient balance' });

    // Create or get active round
    let [rounds] = await conn.query("SELECT * FROM casino_rounds WHERE game_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1", [game_id]);
    let roundId;
    if (rounds.length) {
      roundId = rounds[0].id;
    } else {
      const [r] = await conn.query("INSERT INTO casino_rounds (game_id, round_number, status) VALUES (?, ?, 'open')",
        [game_id, `R${Date.now()}`]);
      roundId = r.insertId;
    }

    const oddsNum = parseFloat(odds) || 2.0;
    const [betResult] = await conn.query(
      "INSERT INTO casino_bets (user_id, game_id, round_id, bet_option, stake, odds, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [userId, game_id, roundId, bet_option, stakeNum, oddsNum]
    );

    const newBalance = parseFloat(users[0].balance) - stakeNum;
    await conn.query('UPDATE users SET balance = ?, exposure = exposure + ? WHERE id = ?', [newBalance, stakeNum, userId]);

    await conn.query(
      "INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, reference_type, description) VALUES (?, 'bet_placed', ?, ?, ?, 'casino_bet', ?)",
      [userId, -stakeNum, newBalance, betResult.insertId, `Casino bet: ${game.name} - ${bet_option}`]
    );

    await conn.commit();

    // Simulate instant result for demo
    const won = Math.random() > 0.5;
    const profitLoss = won ? stakeNum * (oddsNum - 1) : -stakeNum;

    const conn2 = await db.getConnection();
    await conn2.beginTransaction();
    try {
      const status = won ? 'won' : 'lost';
      await conn2.query('UPDATE casino_bets SET status = ?, profit_loss = ?, settled_at = NOW() WHERE id = ?',
        [status, profitLoss, betResult.insertId]);

      const returnAmount = won ? stakeNum + (stakeNum * (oddsNum - 1)) : 0;
      const [currentUser] = await conn2.query('SELECT balance, exposure FROM users WHERE id = ? FOR UPDATE', [userId]);
      const finalBalance = parseFloat(currentUser[0].balance) + returnAmount;
      const finalExposure = Math.max(0, parseFloat(currentUser[0].exposure) - stakeNum);

      await conn2.query('UPDATE users SET balance = ?, exposure = ? WHERE id = ?', [finalBalance, finalExposure, userId]);

      const txnType = won ? 'bet_won' : 'bet_lost';
      await conn2.query(
        "INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, reference_type, description) VALUES (?, ?, ?, ?, ?, 'casino_bet', ?)",
        [userId, txnType, returnAmount, finalBalance, betResult.insertId, `Casino ${status}: ${game.name}`]
      );

      await conn2.commit();

      res.json({
        bet_id: betResult.insertId,
        game: game.name,
        bet_option,
        stake: stakeNum,
        odds: oddsNum,
        result: status,
        profit_loss: profitLoss,
        new_balance: finalBalance
      });
    } catch (e) {
      await conn2.rollback();
      throw e;
    } finally {
      conn2.release();
    }
  } catch (error) {
    await conn.rollback();
    console.error('Casino bet error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getCasinoHistory = async (req, res) => {
  try {
    const { game_id, limit = 50 } = req.query;
    let query = `
      SELECT cb.*, cg.name as game_name, cg.category
      FROM casino_bets cb JOIN casino_games cg ON cb.game_id = cg.id
      WHERE cb.user_id = ?
    `;
    const params = [req.user.id];
    if (game_id) { query += ' AND cb.game_id = ?'; params.push(game_id); }
    query += ' ORDER BY cb.placed_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [bets] = await db.query(query, params);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
