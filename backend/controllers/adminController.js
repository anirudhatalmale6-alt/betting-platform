const bcrypt = require('bcryptjs');
const db = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ activePlayers }]] = await db.query("SELECT COUNT(*) as activePlayers FROM users WHERE role = 'player' AND status = 'active'");
    const [[{ totalBets }]] = await db.query('SELECT COUNT(*) as totalBets FROM bets');
    const [[{ pendingBets }]] = await db.query("SELECT COUNT(*) as pendingBets FROM bets WHERE status = 'matched'");
    const [[{ totalDeposits }]] = await db.query("SELECT COALESCE(SUM(amount), 0) as totalDeposits FROM transactions WHERE type = 'deposit'");
    const [[{ totalWithdrawals }]] = await db.query("SELECT COALESCE(SUM(amount), 0) as totalWithdrawals FROM transactions WHERE type = 'withdrawal'");
    const [[{ liveEvents }]] = await db.query('SELECT COUNT(*) as liveEvents FROM events WHERE is_live = 1');
    const [[{ totalExposure }]] = await db.query('SELECT COALESCE(SUM(exposure), 0) as totalExposure FROM users');

    const [recentBets] = await db.query(`
      SELECT b.*, u.username, e.name as event_name, r.name as runner_name
      FROM bets b JOIN users u ON b.user_id = u.id JOIN events e ON b.event_id = e.id JOIN runners r ON b.runner_id = r.id
      ORDER BY b.placed_at DESC LIMIT 10
    `);

    res.json({
      stats: { totalUsers, activePlayers, totalBets, pendingBets, totalDeposits: parseFloat(totalDeposits), totalWithdrawals: parseFloat(totalWithdrawals), liveEvents, totalExposure: parseFloat(totalExposure) },
      recentBets
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = 'SELECT id, username, role, full_name, phone, email, balance, exposure, credit_limit, commission_rate, status, created_at, last_login FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (search) { query += ' AND (username LIKE ? OR full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const [users] = await db.query(query, params);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role, full_name, phone, email, balance, credit_limit, commission_rate } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length) return res.status(409).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password, role, full_name, phone, email, balance, credit_limit, commission_rate, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hash, role || 'player', full_name, phone, email, balance || 0, credit_limit || 100000, commission_rate || 2, req.user.id]
    );

    if (parseFloat(balance) > 0) {
      await db.query(
        "INSERT INTO transactions (user_id, type, amount, balance_after, description, created_by) VALUES (?, 'deposit', ?, ?, 'Initial balance', ?)",
        [result.insertId, balance, balance, req.user.id]
      );
    }

    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { status, credit_limit, commission_rate, full_name, phone, email } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (credit_limit !== undefined) { updates.push('credit_limit = ?'); params.push(credit_limit); }
    if (commission_rate !== undefined) { updates.push('commission_rate = ?'); params.push(commission_rate); }
    if (full_name) { updates.push('full_name = ?'); params.push(full_name); }
    if (phone) { updates.push('phone = ?'); params.push(phone); }
    if (email) { updates.push('email = ?'); params.push(email); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.adjustBalance = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { amount, type, description } = req.body;
    const userId = req.params.id;

    const [users] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });

    const amountNum = parseFloat(amount);
    const newBalance = parseFloat(users[0].balance) + (type === 'withdrawal' ? -amountNum : amountNum);
    if (newBalance < 0) return res.status(400).json({ error: 'Insufficient balance' });

    await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
    await conn.query(
      'INSERT INTO transactions (user_id, type, amount, balance_after, description, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type || 'deposit', type === 'withdrawal' ? -amountNum : amountNum, newBalance, description || `${type || 'deposit'} by admin`, req.user.id]
    );

    await conn.commit();
    res.json({ message: 'Balance updated', new_balance: newBalance });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { user_id, type, limit = 100 } = req.query;
    let query = `
      SELECT t.*, u.username, u.full_name
      FROM transactions t JOIN users u ON t.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (user_id) { query += ' AND t.user_id = ?'; params.push(user_id); }
    if (type) { query += ' AND t.type = ?'; params.push(type); }
    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [txns] = await db.query(query, params);
    res.json(txns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM settings');
    const obj = {};
    settings.forEach(s => { obj[s.setting_key] = s.setting_value; });
    res.json(obj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
    }
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, expires_at } = req.body;
    await db.query('INSERT INTO announcements (title, message, type, created_by, expires_at) VALUES (?, ?, ?, ?, ?)',
      [title, message, type || 'info', req.user.id, expires_at]);
    res.status(201).json({ message: 'Announcement created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const { user_id, action, limit = 100 } = req.query;
    let query = `
      SELECT al.*, u.username FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
    if (action) { query += ' AND al.action = ?'; params.push(action); }
    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [logs] = await db.query(query, params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
