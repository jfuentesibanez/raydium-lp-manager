# Raydium LP CLI - Automated Liquidity Position Manager

A command-line tool for automating Raydium CLMM (Concentrated Liquidity Market Maker) position management on Solana.

## Features

- **Monitor** positions continuously with auto-rebalancing
- **Status** check for all your LP positions
- **Auto-compound** fees when threshold is reached
- **Auto-rebalance** out-of-range positions
- **Create** new positions from CLI
- **Harvest** fees on demand
- **Configuration-driven** automation

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Wallet

Edit `backend/.env` and set your wallet public key:

```
WALLET_PUBLIC_KEY=YourWalletPublicKeyHere
```

### 3. Run Commands

```bash
# Check status of all positions
npm run dev -- status

# Start monitoring (checks every 5 minutes)
npm run dev -- monitor

# Create config file
npm run dev -- config --init

# View help
npm run dev -- --help
```

## Commands

### `status` - View All Positions

```bash
npm run dev -- status
npm run dev -- status --wallet <address>
```

Shows:
- Position IDs and pool names
- In-range vs out-of-range status
- Current value and APR
- Price ranges
- Pending fees

**Example Output:**
```
Found 2 position(s):

Position: SOL/USDC
  ID: position_xyz_1
  Status: ✓ In Range
  Value: $2100.00
  APR: 28.50%
  Price Range: $95.0000 - $105.0000
  Current Price: $100.5000
  Pending Fees: $12.50

Position: RAY/SOL
  ID: position_xyz_2
  Status: ⚠️  Out of Range
  Value: $850.00
  APR: 35.80%
  Price Range: $0.0200 - $0.0300
  Current Price: $0.0250
  Pending Fees: $5.75

Portfolio Summary:
  Total Value: $2950.00
  Total Pending Fees: $18.25
  Positions In Range: 1/2
  Positions Out of Range: 1/2
```

### `monitor` - Continuous Monitoring

```bash
# Monitor with defaults (every 5 min, auto-rebalance, auto-compound)
npm run dev -- monitor

# Custom interval
npm run dev -- monitor --interval 10

# Disable auto-rebalance
npm run dev -- monitor --no-rebalance

# Disable auto-compound
npm run dev -- monitor --no-compound
```

The monitor will:
- Check positions at regular intervals
- Alert when positions go out of range
- Auto-rebalance if enabled
- Auto-compound fees when threshold reached

**Example Output:**
```
Starting LP Position Monitor
Wallet: YourWalletAddress
Check Interval: Every 5 minutes
Auto-Rebalance: Enabled
Auto-Compound: Enabled

[2025-12-25T20:00:00Z] Running position check...
✓ Check complete. 2 positions monitored, 0 out of range

[2025-12-25T20:05:00Z] Running position check...
⚠️  Position RAY/SOL is OUT OF RANGE
   Current Price: $0.0350
   Position Range: $0.0200 - $0.0300
   → Auto-rebalancing enabled, will rebalance...
```

### `create` - Create New Position

```bash
# Create with ±10% range
npm run dev -- create \
  --pool 61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht \
  --amount 10 \
  --range 10

# Custom price range
npm run dev -- create \
  --pool 61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht \
  --amount 10 \
  --min-price 95 \
  --max-price 105
```

### `harvest` - Harvest Fees

```bash
# Harvest specific position
npm run dev -- harvest --position position_xyz_1

# Harvest all positions
npm run dev -- harvest --all

# Harvest and reinvest
npm run dev -- harvest --all --compound
```

### `rebalance` - Rebalance Position

```bash
# Rebalance with new ±10% range
npm run dev -- rebalance --position position_xyz_1 --range 10
```

### `close` - Close Position

```bash
npm run dev -- close --position position_xyz_1
```

### `config` - Manage Configuration

```bash
# Create config file
npm run dev -- config --init

# View current config
npm run dev -- config --show
```

Configuration file (`raydium-lp.config.yml`):

```yaml
# Automation Settings
automation:
  check_interval: 5  # minutes
  auto_rebalance: true
  auto_compound: true
  rebalance_threshold: 5  # percent price movement
  compound_threshold: 10  # USD minimum to compound

# Position Defaults
defaults:
  price_range: 10  # percent ±
  slippage: 0.5  # percent

# Notifications
notifications:
  enabled: false
  # webhook_url: "https://discord.com/api/webhooks/..."
```

## Running as a Service

To run the monitor 24/7, use a process manager like PM2:

```bash
npm install -g pm2

# Start monitor
pm2 start "npm run dev -- monitor" --name raydium-lp-monitor

# View logs
pm2 logs raydium-lp-monitor

# Stop
pm2 stop raydium-lp-monitor
```

Or use systemd on Linux:

```bash
# Create service file
sudo nano /etc/systemd/system/raydium-lp.service
```

```ini
[Unit]
Description=Raydium LP Monitor
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/stability/backend
ExecStart=/usr/bin/npm run start -- monitor
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable raydium-lp
sudo systemctl start raydium-lp

# Check status
sudo systemctl status raydium-lp

# View logs
sudo journalctl -u raydium-lp -f
```

## Environment Variables

Edit `backend/.env`:

```bash
# Wallet (REQUIRED)
WALLET_PUBLIC_KEY=YourPublicKey

# Solana Network
SOLANA_NETWORK=devnet  # or mainnet-beta
SOLANA_RPC_URL=https://api.devnet.solana.com

# Automation
AUTO_REBALANCE_ENABLED=true
AUTO_COMPOUND_ENABLED=true
POSITION_CHECK_INTERVAL_MS=300000  # 5 minutes
MIN_HARVEST_THRESHOLD_USD=10
MAX_GAS_COST_USD=5

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

## Development Status

Currently implemented:
- ✅ CLI structure with Commander
- ✅ Status command (working with mock data)
- ✅ Monitor command structure (checks positions)
- ✅ Mock service for testing
- ✅ Configuration management

TODO:
- ⏳ Real Raydium SDK integration
- ⏳ Position creation on-chain
- ⏳ Auto-rebalance logic
- ⏳ Auto-compound implementation
- ⏳ Fee harvesting
- ⏳ Discord/Telegram notifications
- ⏳ Analytics and reporting

## Next Steps

1. **Test with Mock Data**: All commands currently work with mock data to test the workflow
2. **Add Real Raydium Integration**: Replace mock service with actual Raydium SDK calls
3. **Implement Automation**: Build out auto-rebalance and auto-compound logic
4. **Add Notifications**: Discord/Telegram alerts for important events
5. **Production Deploy**: Run on a server with systemd or PM2

## Security Notes

- **Never commit wallet private keys** to version control
- Use environment variables for sensitive data
- Consider using a dedicated bot wallet with limited funds for automation
- Test thoroughly on devnet before using on mainnet
