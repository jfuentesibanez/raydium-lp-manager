# Auto-Rebalance System

## Overview

The auto-rebalance system automatically manages concentrated liquidity positions by monitoring price movements and intelligently deciding when to rebalance out-of-range positions. It balances profitability with gas costs to ensure optimal position management.

## How It Works

### Decision Engine

The rebalance strategy uses a multi-layered decision process with comprehensive safety checks:

```
1. Position Value Check → Ensure position is above minimum threshold
2. Range Status Check → Verify position is actually out of range
3. Time Interval Check → Prevent too-frequent rebalancing
4. Price Movement Check → Ensure price moved significantly enough
5. Gas Cost Check → Verify gas costs are acceptable
6. Profitability Check → Ensure rebalancing is economically viable
```

If all checks pass, the system recommends rebalancing.

### Rebalance Process

When a position is rebalanced:

1. **Close Current Position**
   - Withdraw all liquidity
   - Harvest pending fees
   - Receive both tokens

2. **Create New Position**
   - Calculate optimal range centered on current price
   - Redeposit all tokens
   - Resume earning fees in new range

## Configuration

### Default Settings

```typescript
{
  priceMovementThreshold: 5,      // 5% price movement triggers rebalance
  defaultRangePercent: 10,        // ±10% range for new positions
  minRebalanceInterval: 3600000,  // 1 hour minimum between rebalances
  maxGasCostUSD: 5,               // Max $5 gas cost
  minPositionValueUSD: 100        // Min $100 position value
}
```

### Customizing Configuration

You can customize the rebalance strategy when creating positions:

```typescript
import { createRebalanceStrategy } from './core/rebalance-strategy'

const strategy = createRebalanceStrategy({
  priceMovementThreshold: 3,    // More aggressive - trigger at 3%
  defaultRangePercent: 15,      // Wider range - ±15%
  maxGasCostUSD: 10            // Accept higher gas costs
})
```

## Usage

### Manual Rebalancing

Analyze and rebalance a specific position:

```bash
# Analyze position (shows recommendation)
npm run dev -- rebalance --position <POSITION_ID>

# Force rebalance even if not recommended
npm run dev -- rebalance --position <POSITION_ID> --force

# Use custom range width
npm run dev -- rebalance --position <POSITION_ID> --range 15
```

**Example Output:**
```
Found position: RAY/SOL
  Current Value: $850.00
  Current Price: $0.0250
  Price Range: $0.0200 - $0.0300
  Status: ⚠️  Out of Range

Analyzing position...
Calculated new range for RAY/SOL:
  Current Price: $0.0250
  Old Range: $0.0200 - $0.0300
  New Range: $0.0225 - $0.0275 (±10%)

❌ Rebalancing NOT recommended
Reason: Price movement (0.00%) below threshold (5%)

Use --force to rebalance anyway
```

### Automated Monitoring

Enable continuous monitoring with auto-rebalance:

```bash
# Monitor every 5 minutes with auto-rebalance enabled
npm run dev -- monitor --interval 5

# Monitor without auto-rebalance
npm run dev -- monitor --no-rebalance

# Monitor without fee compounding
npm run dev -- monitor --no-compound
```

**Example Output:**
```
Starting LP Position Monitor
Wallet: DummyWalletForTestingWithMockData123456789
Check Interval: Every 5 minutes
Auto-Rebalance: Enabled
Auto-Compound: Enabled

[2025-12-25T20:14:50.502Z] Running position check...
⚠️  Position RAY/SOL is OUT OF RANGE
   Current Price: $0.0318
   Position Range: $0.0200 - $0.0300
   Value: $850.00
   → Auto-rebalancing enabled, analyzing...

Calculated new range for RAY/SOL:
  Current Price: $0.0318
  Old Range: $0.0200 - $0.0300
  New Range: $0.0286 - $0.0350 (±10%)

   ✓ Rebalancing recommended: Position out of range by 7.20%, rebalancing recommended
   → Simulating rebalance...
   ✅ Position rebalanced successfully
```

## Safety Mechanisms

### 1. Minimum Position Value

Positions below the minimum threshold are not rebalanced to avoid wasting gas on small positions.

- **Default:** $100 USD
- **Reason:** Gas costs would eat into returns on tiny positions

### 2. Time Interval Protection

Prevents rebalancing the same position too frequently, even if conditions are met.

- **Default:** 1 hour
- **Reason:** Reduces excessive gas costs and prevents over-trading

### 3. Price Movement Threshold

Only rebalances when price has moved significantly from the position range.

- **Default:** 5% movement
- **Reason:** Minor fluctuations don't justify rebalancing costs

### 4. Gas Cost Limit

Rejects rebalancing if estimated gas costs exceed the maximum.

- **Default:** $5 USD
- **Reason:** Prevents expensive rebalances during high network congestion

### 5. Profitability Check

Ensures rebalancing makes economic sense by comparing:
- Pending fees that can cover gas costs
- Gas cost as percentage of position value (< 1%)

## Price Movement Calculation

The system calculates how far the current price has moved from the position's price range:

```typescript
const rangeCenter = (priceMin + priceMax) / 2

if (currentPrice > priceMax) {
  // Price moved above range
  movement = ((currentPrice - priceMax) / rangeCenter) * 100
} else if (currentPrice < priceMin) {
  // Price moved below range
  movement = ((priceMin - currentPrice) / rangeCenter) * 100
}
```

**Example:**
- Range: $0.0200 - $0.0300 (center: $0.0250)
- Current Price: $0.0318
- Movement: (($0.0318 - $0.0300) / $0.0250) * 100 = 7.2%
- Result: ✅ Exceeds 5% threshold, recommend rebalance

## New Range Calculation

When rebalancing, the system centers a new range around the current price:

```typescript
const rangePercent = defaultRangePercent / 100  // 10% = 0.10
newPriceMin = currentPrice * (1 - rangePercent)
newPriceMax = currentPrice * (1 + rangePercent)
```

**Example:**
- Current Price: $0.0318
- Range Width: ±10%
- New Range: $0.0286 - $0.0350

## Integration with Monitor

The monitor command integrates auto-rebalance seamlessly:

1. **Periodic Checks:** Runs every N minutes (configurable)
2. **Position Scanning:** Checks all positions in wallet
3. **Out-of-Range Detection:** Identifies positions needing attention
4. **Decision Analysis:** Runs rebalance strategy for each position
5. **Automatic Execution:** Rebalances if recommended (mock mode)
6. **Status Tracking:** Records rebalance times to prevent too-frequent changes

## Gas Cost Estimation

Current implementation uses rough estimates for Solana:

```typescript
// Close position: ~0.00001 SOL
// Create position: ~0.00002 SOL
// Total: ~0.00003 SOL (~$0.003 at $100 SOL)
```

**Note:** In production, this should fetch real-time gas prices and SOL price for accurate estimates.

## Best Practices

### 1. Start Conservatively

Begin with default settings and monitor performance before adjusting:
- 5% price movement threshold
- ±10% range width
- 1 hour minimum interval

### 2. Consider Pool Volatility

Adjust settings based on pool characteristics:
- **High Volatility Pools:** Wider ranges (±15-20%), lower thresholds (3%)
- **Stable Pools:** Tighter ranges (±5-8%), higher thresholds (8%)

### 3. Monitor Gas Costs

Track actual gas costs over time and adjust `maxGasCostUSD` accordingly:
- High network congestion: Increase limit or reduce rebalance frequency
- Low congestion: Can be more aggressive

### 4. Position Size Matters

Larger positions justify more frequent rebalancing:
- Small positions ($100-500): Conservative, wide ranges
- Medium positions ($500-5000): Default settings
- Large positions (>$5000): More aggressive, tighter ranges

### 5. Use Force Sparingly

The `--force` flag bypasses safety checks. Only use when:
- You understand why the system declined to rebalance
- You have a specific reason to override (e.g., closing a position)
- You've verified gas costs are acceptable

## Troubleshooting

### Position Marked Out of Range But Won't Rebalance

**Cause:** Price movement below threshold
**Solution:** Check if price actually moved or if it's just at range boundary. Use `--force` if certain.

### "Too soon since last rebalance"

**Cause:** Minimum interval not elapsed
**Solution:** Wait for cooldown period or reduce `minRebalanceInterval` if appropriate.

### "Gas cost exceeds maximum"

**Cause:** Network congestion or low SOL price
**Solution:** Wait for lower gas prices or increase `maxGasCostUSD`.

### "Position value below minimum"

**Cause:** Position too small
**Solution:** Add more liquidity to position or reduce `minPositionValueUSD`.

## Future Enhancements

Planned improvements to the auto-rebalance system:

1. **Real Gas Estimation:** Fetch actual Solana network fees and SOL price
2. **Dynamic Ranges:** Adjust range width based on historical volatility
3. **Partial Rebalancing:** Keep some liquidity in old range while creating new
4. **Fee Compounding:** Automatically reinvest harvested fees
5. **Multi-Pool Optimization:** Coordinate rebalancing across multiple positions
6. **Notification System:** Alert on rebalance events via webhook/email
7. **Strategy Backtesting:** Test different strategies on historical data

## Code Reference

### Core Files

- `src/core/rebalance-strategy.ts` - Main decision logic and calculations
- `src/commands/rebalance.ts` - Manual rebalance command
- `src/commands/monitor.ts` - Automated monitoring with rebalance integration

### Key Interfaces

```typescript
interface RebalanceConfig {
  priceMovementThreshold: number
  defaultRangePercent: number
  minRebalanceInterval: number
  maxGasCostUSD: number
  minPositionValueUSD: number
}

interface PositionInfo {
  id: string
  poolName: string
  currentPrice: number
  priceMin: number
  priceMax: number
  totalValueUSD: number
  isOutOfRange: boolean
  liquidity: string
  token0Amount: number
  token1Amount: number
  pendingFeesUSD: number
}

interface RebalanceDecision {
  shouldRebalance: boolean
  reason: string
  newPriceMin: number
  newPriceMax: number
  estimatedGasCost: number
  recommendedAction: 'rebalance' | 'close' | 'wait'
}
```

## Related Documentation

- [Real Integration Guide](REAL_INTEGRATION.md) - Using real blockchain data
- [CLI Commands](../README.md#commands) - All available commands
- [Configuration Guide](../README.md#configuration) - Environment setup
