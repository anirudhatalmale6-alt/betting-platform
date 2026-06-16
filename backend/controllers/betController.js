const db = require('../config/database');

exports.placeBet = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { market_id, runner_id, bet_type, odds, stake } = req.body;
    const userId = req.user.id;

    if (!market_id || !runner_id || !bet_type || !odds || !stake) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (!['back', 'lay'].includes(bet_type)) {
      return res.status(400).json({ error: 'Invalid bet type' });
    }
    if (parseFloat(stake) <= 0) {
      return res.status(400).json({ error: 'Stake must be positive' });
    }

    const [markets] = await conn.query(
      'SELECT m.*, e.id as event_id, e.status as event_status FROM markets m JOIN events e ON m.event_id = e.id WHERE m.id = ? FOR UPDATE',
      [market_id]
    );
    if (!markets.length) return res.status(404).json({ error: 'Market not found' });

    const market = markets[0];
    if (market.status !== 'open') return res.status(400).json({ error: 'Market is not open' });
    if (!['upcoming', 'live'].includes(market.event_status)) return res.status(400).json({ error: 'Event is not active' });
    if (parseFloat(stake) < parseFloat(market.min_bet)) return res.status(400).json({ error: `Minimum bet is ${market.min_bet}` });
    if (parseFloat(stake) > parseFloat(market.max_bet)) return res.status(400).json({ error: `Maximum bet is ${market.max_bet}` });

    const [runners] = await conn.query('SELECT * FROM runners WHERE id = ? AND market_id = ?', [runner_id, market_id]);
    if (!runners.length) return res.status(404).json({ error: 'Runner not found' });
    if (runners[0].status !== 'active') return res.status(400).json({ error: 'Selection is suspended' });

    const [users] = await conn.query('SELECT balance, exposure FROM users WHERE id = ? FOR UPDATE', [userId]);
    const user = users[0];

    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(odds);
    let potentialProfit, potentialLoss, liability;

    if (bet_type === 'back') {
      potentialProfit = stakeNum * (oddsNum - 1);
      potentialLoss = stakeNum;
      liability = stakeNum;
    } else {
      potentialProfit = stakeNum;
      potentialLoss = stakeNum * (oddsNum - 1);
      liability = potentialLoss;
    }

    if (parseFloat(user.balance) < liability) {
      return res.status(400).json({ error: 'Insufficient balance', required: liability, available: parseFloat(user.balance) });
    }

    const [betResult] = await conn.query(
      `INSERT INTO bets (user_id, event_id, market_id, runner_id, bet_type, odds, stake, potential_profit, potential_loss, status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?)`,
      [userId, market.event_id, market_id, runner_id, bet_type, oddsNum, stakeNum, potentialProfit, potentialLoss, req.ip]
    );

    const newBalance = parseFloat(user.balance) - liability;
    const newExposure = parseFloat(user.exposure) + liability;
    await conn.query('UPDATE users SET balance = ?, exposure = ? WHERE id = ?', [newBalance, newExposure, userId]);

    await conn.query(
      `INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
       VALUES (?, 'bet_placed', ?, ?, ?, 'bet', ?)`,
      [userId, -liability, newBalance, betResult.insertId, `${bet_type.toUpperCase()} bet on ${runners[0].name} @ ${oddsNum}`]
    );

    await conn.commit();

    res.status(201).json({
      bet_id: betResult.insertId,
      bet_type,
      runner: runners[0].name,
      odds: oddsNum,
      stake: stakeNum,
      potential_profit: potentialProfit,
      liability,
      new_balance: newBalance
    });
  } catch (error) {
    await conn.rollback();
    console.error('Place bet error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getUserBets = async (req, res) => {
  try {
    const { status, event_id, limit = 50 } = req.query;
    let query = `
      SELECT b.*, e.name as event_name, e.team_a, e.team_b, m.name as market_name, r.name as runner_name
      FROM bets b
      JOIN events e ON b.event_id = e.id
      JOIN markets m ON b.market_id = m.id
      JOIN runners r ON b.runner_id = r.id
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];

    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (event_id) { query += ' AND b.event_id = ?'; params.push(event_id); }

    query += ' ORDER BY b.placed_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [bets] = await db.query(query, params);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllBets = async (req, res) => {
  try {
    const { status, user_id, event_id, limit = 100 } = req.query;
    let query = `
      SELECT b.*, u.username, u.full_name, e.name as event_name, m.name as market_name, r.name as runner_name
      FROM bets b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      JOIN markets m ON b.market_id = m.id
      JOIN runners r ON b.runner_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (user_id) { query += ' AND b.user_id = ?'; params.push(user_id); }
    if (event_id) { query += ' AND b.event_id = ?'; params.push(event_id); }

    query += ' ORDER BY b.placed_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [bets] = await db.query(query, params);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.settleBet = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { bet_id, result } = req.body;
    if (!['won', 'lost', 'void'].includes(result)) return res.status(400).json({ error: 'Invalid result' });

    const [bets] = await conn.query('SELECT * FROM bets WHERE id = ? AND status = ? FOR UPDATE', [bet_id, 'matched']);
    if (!bets.length) return res.status(404).json({ error: 'Bet not found or already settled' });

    const bet = bets[0];
    const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [bet.user_id]);
    const user = users[0];

    let profitLoss = 0;
    let balanceChange = 0;
    let liability = bet.bet_type === 'back' ? parseFloat(bet.stake) : parseFloat(bet.potential_loss);

    if (result === 'won') {
      profitLoss = parseFloat(bet.potential_profit);
      balanceChange = liability + profitLoss;
    } else if (result === 'lost') {
      profitLoss = -liability;
      balanceChange = 0;
    } else {
      profitLoss = 0;
      balanceChange = liability;
    }

    const newBalance = parseFloat(user.balance) + balanceChange;
    const newExposure = Math.max(0, parseFloat(user.exposure) - liability);

    await conn.query('UPDATE bets SET status = ?, result = ?, profit_loss = ?, settled_at = NOW() WHERE id = ?',
      ['settled', result, profitLoss, bet_id]);

    await conn.query('UPDATE users SET balance = ?, exposure = ? WHERE id = ?',
      [newBalance, newExposure, bet.user_id]);

    const txnType = result === 'won' ? 'bet_won' : result === 'lost' ? 'bet_lost' : 'bet_void';
    await conn.query(
      `INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
       VALUES (?, ?, ?, ?, ?, 'bet', ?)`,
      [bet.user_id, txnType, balanceChange, newBalance, bet_id, `Bet ${result}: ${bet.bet_type} @ ${bet.odds}`]
    );

    await conn.commit();
    res.json({ message: 'Bet settled', result, profit_loss: profitLoss });
  } catch (error) {
    await conn.rollback();
    console.error('Settle bet error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.settleMarket = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { market_id, winner_runner_id } = req.body;

    const [markets] = await conn.query('SELECT * FROM markets WHERE id = ?', [market_id]);
    if (!markets.length) return res.status(404).json({ error: 'Market not found' });

    await conn.query('UPDATE runners SET result = CASE WHEN id = ? THEN ? ELSE ? END, status = CASE WHEN id = ? THEN ? ELSE ? END WHERE market_id = ?',
      [winner_runner_id, 'won', 'lost', winner_runner_id, 'winner', 'loser', market_id]);

    const [bets] = await conn.query('SELECT * FROM bets WHERE market_id = ? AND status = ?', [market_id, 'matched']);

    for (const bet of bets) {
      let result;
      if (bet.bet_type === 'back') {
        result = bet.runner_id === winner_runner_id ? 'won' : 'lost';
      } else {
        result = bet.runner_id === winner_runner_id ? 'lost' : 'won';
      }

      const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [bet.user_id]);
      const user = users[0];
      let liability = bet.bet_type === 'back' ? parseFloat(bet.stake) : parseFloat(bet.potential_loss);
      let balanceChange = 0;
      let profitLoss = 0;

      if (result === 'won') {
        profitLoss = parseFloat(bet.potential_profit);
        balanceChange = liability + profitLoss;
      } else {
        profitLoss = -liability;
      }

      const newBalance = parseFloat(user.balance) + balanceChange;
      const newExposure = Math.max(0, parseFloat(user.exposure) - liability);

      await conn.query('UPDATE bets SET status = ?, result = ?, profit_loss = ?, settled_at = NOW() WHERE id = ?',
        ['settled', result, profitLoss, bet.id]);
      await conn.query('UPDATE users SET balance = ?, exposure = ? WHERE id = ?',
        [newBalance, newExposure, bet.user_id]);

      const txnType = result === 'won' ? 'bet_won' : 'bet_lost';
      await conn.query(
        `INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
         VALUES (?, ?, ?, ?, ?, 'bet', ?)`,
        [bet.user_id, txnType, balanceChange, newBalance, bet.id, `Market settled: ${result}`]
      );
    }

    await conn.query('UPDATE markets SET status = ? WHERE id = ?', ['settled', market_id]);
    await conn.commit();

    res.json({ message: 'Market settled', bets_settled: bets.length });
  } catch (error) {
    await conn.rollback();
    console.error('Settle market error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};
