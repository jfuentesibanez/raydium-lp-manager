# Real Raydium Integration

The CLI now supports **real on-chain data** from Raydium CLMM pools using the official Raydium SDK v2.

## What's Implemented

### ✅ Real Pool Data Fetching
- Fetches actual pool information from Raydium API
- Returns real-time price, TVL, volume, and APR
- Supports 20+ popular CLMM pools on Solana

### ✅ Real Position Data Fetching
- Scans wallet for Raydium CLMM position NFTs
- Fetches position details from on-chain accounts
- Calculates real token amounts and price ranges
- Detects if positions are in or out of range

### ✅ Raydium SDK Integration
- Uses `@raydium-io/raydium-sdk-v2` for reliable data access
- Automatic SDK initialization and connection management
- Fallback handling for API failures

## How to Use

### Test with Mock Data (Default)

```bash
# Uses mock data for testing without blockchain dependency
npm run dev -- status
```

### Test with Real On-Chain Data

```bash
# Fetch real data from Solana blockchain
npm run dev -- status --real
```

**Note**: The `--real` flag will:
1. Connect to the Solana RPC endpoint (devnet or mainnet based on `.env`)
2. Initialize the Raydium SDK
3. Fetch actual pool and position data from the blockchain
4. May take longer than mock data due to network calls

### Use Your Real Wallet

Edit `backend/.env` and set your actual wallet address:

```bash
WALLET_PUBLIC_KEY=YourActualSolanaWalletAddressHere
```

Then run:

```bash
npm run dev -- status --real
```

This will fetch YOUR REAL positions from Raydium!

## Network Configuration

### Devnet (Testing)

```bash
# backend/.env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

Devnet is safe for testing without risking real funds.

### Mainnet (Production)

```bash
# backend/.env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Or use a premium RPC provider for better reliability:
# SOLANA_RPC_URL=https://your-helius-url.com
# SOLANA_RPC_URL=https://your-quicknode-url.com
```

⚠️ **Warning**: Mainnet uses real SOL and tokens. Be careful!

## Example Output

### With Mock Data
```
npm run dev -- status

Data source: MOCK data
Found 2 position(s):

Position: SOL/USDC
  ID: position_DummyWal_1
  Status: ✓ In Range
  Value: $2100.00
  ...
```

### With Real Data
```
npm run dev -- status --real

Data source: REAL on-chain data
Initializing Raydium SDK...
Raydium SDK initialized successfully
Fetching positions for wallet: 45iN...5zJY

Found 1 position(s):

Position: SOL/USDC
  ID: 7xKXt...9vQz
  Status: ⚠️  Out of Range
  Value: $1,523.50
  APR: 42.30%
  Price Range: $95.00 - $105.00
  Current Price: $110.25
  Pending Fees: $8.75
```

## Implementation Details

### Services Layer

The CLI uses two service implementations:

1. **`raydium-mock.service.ts`** - Returns mock data for testing
2. **`raydium.service.ts`** - Fetches real data from Raydium SDK

Both implement the same interface, making it easy to switch between them.

### Key Features

**Pool Data (`getPoolInfo`)**:
- Fetches from Raydium API using pool address
- Falls back to on-chain data if API fails
- Returns pool metadata, current price, TVL, APR

**Position Data (`getWalletPositions`)**:
- Scans wallet for position NFTs
- Derives position PDAs from NFT mints
- Deserializes position account data using SDK
- Calculates current value and fees

**Popular Pools (`getPopularPools`)**:
- Fetches top 20 concentrated liquidity pools
- Sorted by liquidity (TVL)
- Includes volume and APR metrics

### Code Structure

```
backend/src/
├── services/
│   ├── raydium-mock.service.ts  # Mock data (default)
│   └── raydium.service.ts       # Real data (--real flag)
├── commands/
│   └── status.ts                # Updated to support both modes
└── cli.ts                        # Added --real flag option
```

## Next Steps

Now that real data integration works, you can:

1. **Monitor Real Positions**: Use `monitor --real` to track your actual positions
2. **Implement Auto-Rebalance**: Build logic to auto-rebalance out-of-range positions
3. **Add Auto-Compound**: Automatically harvest and reinvest fees
4. **Create Real Positions**: Implement actual position creation on-chain
5. **Add Notifications**: Alert via Discord/Telegram when positions go out of range

## Troubleshooting

### "Failed to initialize Raydium SDK"
- Check your RPC URL is correct and accessible
- Try using a premium RPC provider (Helius, QuickNode)
- Ensure you have internet connectivity

### "No positions found" (but you have positions)
- Verify your wallet address is correct
- Check you're on the right network (devnet vs mainnet)
- Ensure positions are Raydium CLMM (not AMM V4)

### Slow Performance
- Use a faster RPC endpoint
- Consider caching pool data
- The first SDK initialization takes time (subsequent calls are cached)

### API Rate Limiting
- Implement request throttling
- Add retry logic with exponential backoff
- Consider self-hosting the Raydium API

## Security Notes

- ✅ Read-only operations are safe
- ✅ No private keys needed for fetching data
- ⚠️ Be careful when implementing write operations (create/close positions)
- ⚠️ Never commit wallet private keys to version control
- ⚠️ Test thoroughly on devnet before using mainnet
