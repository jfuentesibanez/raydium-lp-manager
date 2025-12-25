# Quick Start Guide

Get the Raydium LP Manager running in 5 minutes (assuming you already have PostgreSQL and Redis installed).

## Prerequisites Check

Verify you have the required software:

```bash
node --version    # Should be v18+
psql --version    # Should be v14+
redis-cli --version  # Should be v6+
```

If any are missing, see [SETUP.md](./SETUP.md) for installation instructions.

## 1. Install Dependencies

```bash
# From project root
npm install
```

## 2. Setup Database

```bash
# Create PostgreSQL database
createdb raydium_lp_manager

# Initialize schema
cd backend
npm run build
node dist/database/init.js
cd ..
```

## 3. Configure Environment

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and update DATABASE_URL if needed
```

## 4. Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Or manually
redis-server
```

## 5. Run the Application

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 6. Access the App

Open http://localhost:3000 in your browser and connect your Phantom wallet!

## Troubleshooting

**Database connection error?**
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `backend/.env`

**Redis connection error?**
- Check Redis is running: `redis-cli ping`
- Should return "PONG"

**Frontend won't start?**
- Clear node_modules: `rm -rf frontend/node_modules && cd frontend && npm install`

**Backend TypeScript errors?**
- Rebuild: `cd backend && npm run build`

For detailed troubleshooting, see [SETUP.md](./SETUP.md).

## What's Next?

1. **Connect Wallet**: Click the "Connect Wallet" button
2. **Explore Dashboard**: View your portfolio overview
3. **Create Position**: Click "Create New Position" (coming soon)
4. **Monitor Positions**: Track your liquidity positions in real-time

## Features Currently Available

- Wallet connection (Phantom)
- Portfolio overview dashboard
- Position monitoring UI
- REST API endpoints
- Database schema for positions
- Health check endpoint

## Coming Soon

- Position creation interface
- Raydium CLMM integration
- Add/Remove liquidity
- Harvest yields
- Automated rebalancing
- Auto-compounding
- Price monitoring with Pyth

## Development Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # Check TypeScript

# Backend
cd backend
npm run dev          # Start dev server with watch
npm run build        # Compile TypeScript
npm start            # Run production build
npm run type-check   # Check TypeScript
```

## Project Structure

```
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React hooks
│   │   ├── pages/         # Pages
│   │   ├── providers/     # Wallet provider
│   │   └── utils/         # Utilities
│   └── package.json
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── database/      # DB connection & schema
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utilities
│   └── package.json
│
├── README.md          # Full documentation
├── SETUP.md           # Detailed setup guide
└── QUICKSTART.md      # This file
```
