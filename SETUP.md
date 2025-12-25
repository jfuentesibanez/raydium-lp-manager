# Raydium LP Manager - Setup Guide

This guide will help you set up and run the Raydium Liquidity Pool Manager locally.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Phantom wallet browser extension

## Installation

### 1. Clone and Install Dependencies

```bash
# Install dependencies for both frontend and backend
npm install

# Or install separately
cd frontend && npm install
cd ../backend && npm install
```

### 2. Database Setup

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE raydium_lp_manager;
CREATE USER raydium_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE raydium_lp_manager TO raydium_user;
\q
```

#### Initialize Schema

```bash
cd backend
npm run build
node dist/database/init.js
```

### 3. Redis Setup

#### Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

### 4. Environment Configuration

#### Frontend Environment

Copy the example env file and update:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_SOLANA_NETWORK=mainnet-beta
# Optional: Add custom RPC endpoint for better performance
# VITE_SOLANA_RPC_URL=https://your-rpc-endpoint.com
```

#### Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=4000
NODE_ENV=development

# Update with your database credentials
DATABASE_URL=postgresql://raydium_user:your_password@localhost:5432/raydium_lp_manager
POSTGRES_USER=raydium_user
POSTGRES_PASSWORD=your_password

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Solana RPC (use a paid service for production)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will start on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:3000

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Verifying Installation

### 1. Check Backend Health

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "dbTime": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Frontend

Open http://localhost:3000 in your browser. You should see the Raydium LP Manager dashboard.

### 3. Connect Wallet

1. Install Phantom wallet extension if not already installed
2. Click "Connect Wallet" button
3. Approve the connection in Phantom
4. Your wallet address and SOL balance should appear

## Project Structure

```
raydium-lp-manager/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── providers/       # Context providers
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                  # Node.js backend server
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── database/        # Database connection & schema
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   └── package.json
└── README.md                # Project overview
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   # macOS/Linux
   pg_isready

   # Or check service status
   brew services list | grep postgresql
   systemctl status postgresql
   ```

2. Verify credentials in `.env` match database setup

3. Check PostgreSQL logs:
   ```bash
   # macOS (Homebrew)
   tail -f /usr/local/var/log/postgresql@14.log

   # Linux
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

### Redis Connection Issues

1. Check Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Check service status:
   ```bash
   # macOS
   brew services list | grep redis

   # Linux
   systemctl status redis-server
   ```

### RPC Rate Limiting

If you encounter RPC rate limiting errors, consider using a paid RPC provider:
- Helius: https://helius.xyz
- QuickNode: https://quicknode.com
- Alchemy: https://alchemy.com

Update `SOLANA_RPC_URL` in both frontend and backend `.env` files.

### Wallet Connection Issues

1. Ensure Phantom wallet is installed
2. Make sure you're on the correct network (mainnet/devnet)
3. Try disconnecting and reconnecting wallet
4. Clear browser cache and reload

## Next Steps

Once setup is complete, you can:
1. Connect your wallet
2. View your portfolio (if you have existing positions)
3. Create new liquidity positions
4. Monitor position performance
5. Enable automation features (rebalancing, compounding)

## Support

For issues and questions:
- Check the main README.md for feature documentation
- Review the troubleshooting section above
- Check application logs in `backend/logs/`

## Security Notes

- Never commit `.env` files to version control
- Keep your wallet private keys secure
- Use test wallets for development
- Review all transactions before signing
- Start with small amounts when testing
