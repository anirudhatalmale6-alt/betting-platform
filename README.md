# BettingPro - Indian Betting Platform

Full-stack betting exchange platform with real-time live betting on Cricket, Football, Tennis + Casino games.

## Features

### Sports Betting
- **Cricket**: IPL, World Cup, BBL, Test Matches
- **Football**: EPL, UCL, La Liga, ISL
- **Tennis**: Wimbledon, Australian Open, US Open
- Back/Lay betting with real-time odds updates
- Fancy markets for cricket (Total Runs, Sixes, Top Batsman)

### Casino Games
- Teen Patti, Andar Bahar, 32 Cards, Bollywood Casino (Indian games)
- Lucky 7, Dragon Tiger, Hi-Lo (Live casino)
- Roulette, Baccarat (Table games)
- Crash game

### User Roles
1. **Admin** - Full control: manage users, events, markets, odds, settlements, settings
2. **Bookmaker** - Manage markets, set/update odds, view ledgers, view bets
3. **Player** - Place bets, view bet history, manage wallet, play casino

### Real-Time
- Socket.io for live odds updates (every 3 seconds)
- Live score simulation for cricket matches
- Instant casino game results

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, MySQL
- **Frontend**: React (Vite), Tailwind CSS, React Router
- **Auth**: JWT with role-based access control
- **Database**: MySQL with InnoDB

## Setup Guide

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### 1. Clone the repository
```bash
git clone <repo-url>
cd betting-platform
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run setup    # Creates database, tables, and seed data
npm start        # Starts on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts on port 5173
```

### 4. Open in browser
Navigate to `http://localhost:5173`

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Bookmaker | bookmaker1 | bookmaker123 |
| Player | demo | player123 |
| Player | player1 | player123 |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/password` - Change password

### Events
- `GET /api/events/sports` - List sports
- `GET /api/events` - List events (filter by sport_id, status, is_live)
- `GET /api/events/:id` - Event detail with markets & runners
- `POST /api/events` - Create event (admin/bookmaker)
- `PUT /api/events/:id` - Update event (admin/bookmaker)

### Markets
- `GET /api/markets` - List markets
- `POST /api/markets` - Create market (admin/bookmaker)
- `PUT /api/markets/:id` - Update market (admin/bookmaker)
- `PUT /api/markets/odds/update` - Update odds (admin/bookmaker)

### Bets
- `POST /api/bets/place` - Place bet (player)
- `GET /api/bets/my` - My bets
- `GET /api/bets/all` - All bets (admin/bookmaker)
- `POST /api/bets/settle` - Settle single bet (admin/bookmaker)
- `POST /api/bets/settle-market` - Settle entire market (admin/bookmaker)

### Casino
- `GET /api/casino/games` - List casino games
- `POST /api/casino/bet` - Place casino bet
- `GET /api/casino/history` - Casino bet history

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/balance` - Deposit/Withdraw
- `GET /api/admin/transactions` - Transaction history
- `GET /api/admin/settings` - Site settings
- `PUT /api/admin/settings` - Update settings

## VPS Deployment

### Using PM2
```bash
# Backend
cd backend
npm install --production
pm2 start server.js --name betting-api

# Frontend (build and serve)
cd frontend
npm install
npm run build
# Serve dist/ with nginx
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## Database Schema

13 tables covering users, sports, tournaments, events, markets, runners, bets, transactions, casino games, casino rounds, casino bets, activity log, settings, and announcements.

Run `npm run migrate` to create all tables.
Run `npm run seed` to populate with demo data.
