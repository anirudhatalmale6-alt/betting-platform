const db = require('../config/database');

exports.getSports = async (req, res) => {
  try {
    const [sports] = await db.query('SELECT * FROM sports WHERE is_active = 1 ORDER BY sort_order');
    res.json(sports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { sport_id, status, is_live } = req.query;
    let query = `
      SELECT e.*, s.name as sport_name, s.slug as sport_slug, t.name as tournament_name,
      (SELECT COUNT(*) FROM markets m WHERE m.event_id = e.id AND m.status = 'open') as open_markets
      FROM events e
      JOIN sports s ON e.sport_id = s.id
      LEFT JOIN tournaments t ON e.tournament_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (sport_id) { query += ' AND e.sport_id = ?'; params.push(sport_id); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (is_live === '1') { query += ' AND e.is_live = 1'; }

    query += ' ORDER BY e.is_live DESC, e.start_time ASC';

    const [events] = await db.query(query, params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEventDetail = async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT e.*, s.name as sport_name, s.slug as sport_slug, t.name as tournament_name
      FROM events e
      JOIN sports s ON e.sport_id = s.id
      LEFT JOIN tournaments t ON e.tournament_id = t.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!events.length) return res.status(404).json({ error: 'Event not found' });

    const [markets] = await db.query('SELECT * FROM markets WHERE event_id = ? ORDER BY market_type, id', [req.params.id]);

    const marketIds = markets.map(m => m.id);
    let runners = [];
    if (marketIds.length) {
      [runners] = await db.query('SELECT * FROM runners WHERE market_id IN (?) ORDER BY sort_order', [marketIds]);
    }

    const marketsWithRunners = markets.map(m => ({
      ...m,
      runners: runners.filter(r => r.market_id === m.id)
    }));

    res.json({ event: events[0], markets: marketsWithRunners });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { sport_id, tournament_id, name, team_a, team_b, start_time, tv_channel } = req.body;
    const [result] = await db.query(
      'INSERT INTO events (sport_id, tournament_id, name, team_a, team_b, start_time, tv_channel, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sport_id, tournament_id, name || `${team_a} v ${team_b}`, team_a, team_b, start_time, tv_channel, req.user.id]
    );

    // Auto-create match odds market
    const [market] = await db.query(
      'INSERT INTO markets (event_id, name, market_type) VALUES (?, ?, ?)',
      [result.insertId, 'Match Odds', 'match_odds']
    );

    // Auto-create runners
    await db.query(
      'INSERT INTO runners (market_id, name, sort_order, back_price, lay_price) VALUES (?, ?, 1, 1.50, 1.52), (?, ?, 2, 2.50, 2.54)',
      [market.insertId, team_a, market.insertId, team_b]
    );

    if (parseInt(sport_id) === 2) {
      await db.query('INSERT INTO runners (market_id, name, sort_order, back_price, lay_price) VALUES (?, ?, 3, 3.50, 3.60)', [market.insertId, 'The Draw']);
    }

    res.status(201).json({ id: result.insertId, message: 'Event created' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { status, is_live, score_a, score_b, result } = req.body;
    const updates = [];
    const params = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (is_live !== undefined) { updates.push('is_live = ?'); params.push(is_live); }
    if (score_a !== undefined) { updates.push('score_a = ?'); params.push(score_a); }
    if (score_b !== undefined) { updates.push('score_b = ?'); params.push(score_b); }
    if (result !== undefined) { updates.push('result = ?'); params.push(result); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await db.query(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTournaments = async (req, res) => {
  try {
    const { sport_id } = req.query;
    let query = 'SELECT * FROM tournaments WHERE is_active = 1';
    const params = [];
    if (sport_id) { query += ' AND sport_id = ?'; params.push(sport_id); }
    query += ' ORDER BY name';
    const [tournaments] = await db.query(query, params);
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
