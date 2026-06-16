const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      } catch (e) {
        // Allow unauthenticated connections for public odds viewing
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (${socket.userRole || 'guest'})`);

    socket.on('join_event', (eventId) => {
      socket.join(`event_${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      socket.leave(`event_${eventId}`);
    });

    socket.on('join_admin', () => {
      if (socket.userRole === 'admin' || socket.userRole === 'bookmaker') {
        socket.join('admin_room');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Simulate live odds updates every 3 seconds
  setInterval(async () => {
    try {
      const [liveEvents] = await db.query(`
        SELECT e.id FROM events e WHERE e.is_live = 1
      `);

      for (const event of liveEvents) {
        const [runners] = await db.query(`
          SELECT r.*, m.market_type, m.id as market_id
          FROM runners r
          JOIN markets m ON r.market_id = m.id
          WHERE m.event_id = ? AND m.status = 'open' AND r.status = 'active'
        `, [event.id]);

        const updates = [];
        for (const runner of runners) {
          const backPrice = parseFloat(runner.back_price);
          const layPrice = parseFloat(runner.lay_price);

          if (backPrice > 0) {
            const fluctuation = (Math.random() - 0.5) * 0.06;
            const newBack = Math.max(1.01, backPrice + fluctuation);
            const newLay = Math.max(newBack + 0.01, layPrice + fluctuation);
            const backSize = parseFloat(runner.back_size) + (Math.random() - 0.3) * 10000;
            const laySize = parseFloat(runner.lay_size) + (Math.random() - 0.3) * 10000;

            await db.query('UPDATE runners SET back_price = ?, lay_price = ?, back_size = ?, lay_size = ? WHERE id = ?',
              [newBack.toFixed(2), newLay.toFixed(2), Math.max(0, backSize).toFixed(0), Math.max(0, laySize).toFixed(0), runner.id]);

            updates.push({
              runner_id: runner.id,
              market_id: runner.market_id,
              market_type: runner.market_type,
              name: runner.name,
              back_price: newBack.toFixed(2),
              lay_price: newLay.toFixed(2),
              back_size: Math.max(0, backSize).toFixed(0),
              lay_size: Math.max(0, laySize).toFixed(0)
            });
          }
        }

        if (updates.length) {
          io.to(`event_${event.id}`).emit('odds_update', { event_id: event.id, runners: updates });
        }
      }
    } catch (error) {
      // Silently handle
    }
  }, 3000);

  // Simulate score updates every 15 seconds for live cricket
  setInterval(async () => {
    try {
      const [liveEvents] = await db.query(`
        SELECT * FROM events WHERE is_live = 1 AND sport_id = 1
      `);

      for (const event of liveEvents) {
        const score = event.score_a;
        const match = score.match(/(\d+)\/(\d+)\s*\((\d+\.?\d*)\)/);
        if (match) {
          let runs = parseInt(match[1]);
          let wickets = parseInt(match[2]);
          let overs = parseFloat(match[3]);

          runs += Math.floor(Math.random() * 8);
          if (Math.random() < 0.08) wickets = Math.min(10, wickets + 1);

          const ballsInOver = Math.round((overs % 1) * 10);
          let newBalls = ballsInOver + 1;
          if (newBalls >= 6) {
            overs = Math.floor(overs) + 1;
          } else {
            overs = Math.floor(overs) + newBalls / 10;
          }

          if (overs > 20) continue;
          const newScore = `${runs}/${wickets} (${overs.toFixed(1)})`;
          await db.query('UPDATE events SET score_a = ? WHERE id = ?', [newScore, event.id]);

          io.to(`event_${event.id}`).emit('score_update', {
            event_id: event.id,
            score_a: newScore,
            score_b: event.score_b
          });
        }
      }
    } catch (error) {
      // Silently handle
    }
  }, 15000);
};
