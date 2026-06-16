const db = require('../config/database');

exports.getMarkets = async (req, res) => {
  try {
    const { event_id } = req.query;
    let query = `
      SELECT m.*, e.name as event_name
      FROM markets m
      JOIN events e ON m.event_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (event_id) { query += ' AND m.event_id = ?'; params.push(event_id); }
    query += ' ORDER BY m.id';

    const [markets] = await db.query(query, params);

    const marketIds = markets.map(m => m.id);
    let runners = [];
    if (marketIds.length) {
      [runners] = await db.query('SELECT * FROM runners WHERE market_id IN (?) ORDER BY sort_order', [marketIds]);
    }

    const result = markets.map(m => ({
      ...m,
      runners: runners.filter(r => r.market_id === m.id)
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createMarket = async (req, res) => {
  try {
    const { event_id, name, market_type, min_bet, max_bet, runners } = req.body;
    const [result] = await db.query(
      'INSERT INTO markets (event_id, name, market_type, min_bet, max_bet) VALUES (?, ?, ?, ?, ?)',
      [event_id, name, market_type, min_bet || 100, max_bet || 500000]
    );

    if (runners && runners.length) {
      for (let i = 0; i < runners.length; i++) {
        await db.query(
          'INSERT INTO runners (market_id, name, sort_order, back_price, lay_price) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, runners[i].name, i + 1, runners[i].back_price || 0, runners[i].lay_price || 0]
        );
      }
    }

    res.status(201).json({ id: result.insertId, message: 'Market created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateMarket = async (req, res) => {
  try {
    const { status, min_bet, max_bet, bet_delay } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (min_bet !== undefined) { updates.push('min_bet = ?'); params.push(min_bet); }
    if (max_bet !== undefined) { updates.push('max_bet = ?'); params.push(max_bet); }
    if (bet_delay !== undefined) { updates.push('bet_delay = ?'); params.push(bet_delay); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await db.query(`UPDATE markets SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Market updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOdds = async (req, res) => {
  try {
    const { runner_id, back_price, lay_price, back_size, lay_size, status } = req.body;
    const updates = [];
    const params = [];

    if (back_price !== undefined) { updates.push('back_price = ?'); params.push(back_price); }
    if (lay_price !== undefined) { updates.push('lay_price = ?'); params.push(lay_price); }
    if (back_size !== undefined) { updates.push('back_size = ?'); params.push(back_size); }
    if (lay_size !== undefined) { updates.push('lay_size = ?'); params.push(lay_size); }
    if (status) { updates.push('status = ?'); params.push(status); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(runner_id);
    await db.query(`UPDATE runners SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Odds updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
