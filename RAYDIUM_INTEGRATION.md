# Raydium CLMM Integration Guide

This document explains the Raydium Concentrated Liquidity Market Maker (CLMM) integration implementation.

## Overview

The application integrates with Raydium's CLMM pools to:
- Fetch pool data (prices, liquidity, APR)
- Monitor user positions across pools
- Enable position management (create, modify, close)
- Track yield and pending fees

## Current Implementation Status

### ✅ Implemented (Mock Data)

Currently, the application uses a **mock service** that returns simulated data. This allows full UI/UX development and testing without needing actual on-chain integration.

**Location**: `backend/src/services/raydium-mock.service.ts`

**Features**:
- Popular pools list with realistic data
- Mock user positions (2 positions per wallet)
- Pool information (price, TVL, volume, APR)
- Position details (tokens, ranges, fees)

**Mock Pools**:
1. SOL/USDC - $10M TVL, 28.5% APR
2. SOL/USDT - $6.5M TVL, 22.3% APR
3. RAY/SOL - $3.2M TVL, 35.8% APR
4. mSOL/SOL - $4.5M TVL, 12.5% APR

### 🚧 To Be Implemented (Real Integration)

**Location**: `backend/src/services/raydium.service.ts`

This file contains the structure for real Raydium integration but needs:

1. **Account Deserialization**
   - Use Raydium CLMM IDL
   - Deserialize pool state accounts
   - Deserialize position NFT accounts

2. **Pool Discovery**
   - Query all CLMM pools via `getProgramAccounts`
   - Filter and sort by TVL/volume
   - Maintain pool address registry

3. **Position Fetching**
   - Query position NFTs owned by wallet
   - Calculate current position values
   - Track pending fees and rewards

## Architecture

### Backend Services

```
backend/src/services/
├── raydium.service.ts       # Real integration (skeleton)
└── raydium-mock.service.ts  # Mock implementation (active)
```

### API Endpoints

```
GET /api/pools/popular           # List popular pools
GET /api/pools/:poolAddress      # Get pool details
GET /api/positions/live/:wallet  # Fetch live positions from Raydium
GET /api/positions/:wallet       # Get positions from database
POST /api/positions              # Create position record
PUT /api/positions/:id           # Update position
DELETE /api/positions/:id        # Delete position
```

### Frontend Integration

```
frontend/src/services/api.ts
├── getPopularPools()     # Fetch available pools
├── getPoolDetails()      # Get specific pool data
└── getLivePositions()    # Get user's Raydium positions
```

### Data Flow

```
User connects wallet
      ↓
Frontend calls getLivePositions(walletAddress)
      ↓
Backend hits Raydium service
      ↓
[Currently: Mock service returns simulated data]
[Future: Real service queries Solana blockchain]
      ↓
Data transformed to frontend types
      ↓
Dashboard displays positions
```

## Switching from Mock to Real

To switch from mock to real Raydium integration:

### Backend

**File**: `backend/src/routes/pools.ts` and `backend/src/routes/positions.ts`

```typescript
// Change this:
import raydiumService from '../services/raydium-mock.service'

// To this:
import raydiumService from '../services/raydium.service'
```

### Prerequisites

Before switching, implement in `raydium.service.ts`:

1. **Pool State Deserialization**
```typescript
private deserializePoolState(data: Buffer): PoolState {
  // Use Raydium CLMM IDL with Anchor
  // Or use Raydium SDK if available
}
```

2. **Position State Deserialization**
```typescript
private deserializePositionState(data: Buffer): PositionState {
  // Deserialize position NFT account
}
```

3. **Pool Registry**
   - Maintain list of known CLMM pool addresses
   - Or implement pool discovery via `getProgramAccounts`

## Real Implementation Guide

### Step 1: Get Raydium CLMM IDL

```bash
# Option 1: Use Anchor IDL
anchor idl fetch CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK

# Option 2: Use Raydium SDK (if available)
npm install @raydium-io/raydium-sdk
```

### Step 2: Implement Pool Fetching

```typescript
async getPoolInfo(poolAddress: string): Promise<PoolData> {
  const poolPubkey = new PublicKey(poolAddress)
  const accountInfo = await this.connection.getAccountInfo(poolPubkey)

  // Use Anchor to deserialize
  const poolState = await program.account.poolState.fetch(poolPubkey)

  // Calculate price from sqrtPriceX64
  const price = this.sqrtPriceX64ToPrice(poolState.sqrtPriceX64)

  return {
    address: poolAddress,
    token0Mint: poolState.tokenMint0.toString(),
    token1Mint: poolState.tokenMint1.toString(),
    currentPrice: price,
    liquidity: poolState.liquidity.toString(),
    // ... other fields
  }
}
```

### Step 3: Implement Position Fetching

```typescript
async getWalletPositions(walletAddress: string): Promise<Position[]> {
  const wallet = new PublicKey(walletAddress)

  // Find all position NFTs owned by wallet
  const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
    wallet,
    { programId: TOKEN_PROGRAM_ID }
  )

  const positions = []

  for (const account of tokenAccounts.value) {
    // Check if token amount === 1 (NFT)
    if (account.data.parsed.info.tokenAmount.uiAmount === 1) {
      const mint = new PublicKey(account.data.parsed.info.mint)

      // Derive position PDA
      const [positionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('position'), mint.toBuffer()],
        RAYDIUM_CLMM_PROGRAM_ID
      )

      // Fetch position account
      const position = await program.account.positionState.fetch(positionPDA)

      // Process position data
      positions.push(this.transformPosition(position, mint))
    }
  }

  return positions
}
```

### Step 4: Calculate Position Values

The service includes helper methods for:

- `sqrtPriceX64ToPrice()` - Convert Raydium's price format
- `tickToPrice()` - Convert tick to price
- `getTokenAmountsFromLiquidity()` - Calculate token amounts

These are based on Uniswap V3 math (Raydium CLMM uses same formulas).

## Testing

### Test with Mock Data

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test endpoints
curl http://localhost:4000/api/pools/popular
curl http://localhost:4000/api/positions/live/YOUR_WALLET_ADDRESS
```

### Test with Real Data (After Implementation)

1. Switch to real service (see above)
2. Use devnet first:
   ```bash
   # In backend/.env
   SOLANA_NETWORK=devnet
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```
3. Test with a wallet that has devnet positions
4. Once verified, switch to mainnet

## Key Data Structures

### Pool State
```typescript
interface PoolState {
  tokenMint0: PublicKey
  tokenMint1: PublicKey
  liquidity: string
  sqrtPriceX64: string  // Current price (needs conversion)
  tickCurrent: number   // Current tick
  feeGrowthGlobal0X64: string
  feeGrowthGlobal1X64: string
  // ... more fields
}
```

### Position State
```typescript
interface PositionState {
  poolId: PublicKey
  nftMint: PublicKey
  tickLowerIndex: number    // Price range min
  tickUpperIndex: number    // Price range max
  liquidity: string
  tokenFeesOwed0: string   // Pending fees
  tokenFeesOwed1: string
  // ... more fields
}
```

## Resources

- **Raydium CLMM Program**: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
- **Raydium Docs**: https://docs.raydium.io/
- **Uniswap V3 Whitepaper**: https://uniswap.org/whitepaper-v3.pdf (for math formulas)
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Anchor**: https://www.anchor-lang.com/

## Price Calculation

Raydium uses `sqrtPriceX64` format:

```typescript
const Q64 = new Decimal(2).pow(64)
const sqrtPrice = new Decimal(sqrtPriceX64).div(Q64)
const price = sqrtPrice.pow(2)
```

## Tick to Price Conversion

```typescript
const price = Math.pow(1.0001, tick)
```

## Known Pool Addresses (Mainnet)

You'll need to populate these addresses:

```typescript
const KNOWN_POOLS = {
  'SOL/USDC': 'xxx...',  // Add real addresses
  'SOL/USDT': 'xxx...',
  'RAY/SOL': 'xxx...',
  'mSOL/SOL': 'xxx...',
}
```

These can be found on:
- Raydium UI (inspect network calls)
- Raydium API documentation
- Solana Explorer

## Next Steps

1. ✅ Mock service working (current)
2. ⏭️ Get Raydium CLMM IDL or SDK
3. ⏭️ Implement account deserialization
4. ⏭️ Implement pool discovery
5. ⏭️ Test on devnet
6. ⏭️ Deploy to mainnet
7. ⏭️ Add price oracles (Pyth) for USD values
8. ⏭️ Implement position creation/modification

## Support

For Raydium-specific questions:
- Raydium Discord: https://discord.gg/raydium
- Raydium Documentation: https://docs.raydium.io/

For development questions, check the main README and SETUP guides.
