# Auto-Rebalance Testing Guide

This guide will walk you through testing all aspects of the auto-rebalance system.

## Prerequisites

Make sure you have:
- ✅ Backend dependencies installed (`npm install`)
- ✅ `.env` file configured with your wallet address
- ✅ TypeScript compiling without errors (`npm run type-check`)

## Test Suite Overview

We'll test:
1. **Basic status checking** - View positions
2. **Manual rebalance analysis** - Decision-making without execution
3. **Forced rebalancing** - Override safety checks
4. **Automated monitoring** - Continuous position tracking
5. **Safety mechanisms** - Verify all protection layers

---

## Test 1: View Position Status

**Goal:** Verify you can see all positions and their status

```bash
npm run dev -- status
```

**Expected Output:**
```
Found 2 position(s):

Position: SOL/USDC
  ID: position_DummyWal_1
  Status: ✓ In Range
  Value: $2100.00
  ...

Position: RAY/SOL
  ID: position_DummyWal_2
  Status: ⚠️  Out of Range
  Value: $850.00
  ...
```

**Verify:**
- ✓ All positions are listed
- ✓ In-range vs out-of-range status is correct
- ✓ Values and prices are displayed properly

---

## Test 2: Analyze In-Range Position

**Goal:** Verify the system correctly handles positions that don't need rebalancing

```bash
npm run dev -- rebalance --position position_DummyWal_1
```

**Expected Output:**
```
Found position: SOL/USDC
  Current Value: $2100.00
  Current Price: $100.5000
  Price Range: $95.0000 - $105.0000
  Status: ✓ In Range

Analyzing position...
Calculated new range for SOL/USDC:
  Current Price: $100.5000
  Old Range: $95.0000 - $105.0000
  New Range: $90.4500 - $110.5500 (±10%)

❌ Rebalancing NOT recommended
Reason: Position is still in range

Use --force to rebalance anyway
```

**Verify:**
- ✓ System recognizes position is in range
- ✓ Rebalancing is NOT recommended
- ✓ New range is calculated anyway (for info)
- ✓ Suggests using --force if override needed

---

## Test 3: Analyze Out-of-Range Position

**Goal:** Test the decision engine with an out-of-range position

```bash
npm run dev -- rebalance --position position_DummyWal_2
```

**Expected Output:**
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

**Why not recommended?**
The position is marked as "out of range" but the price ($0.0250) is actually at the exact center of the range ($0.0200 - $0.0300). The price movement is 0%, which is below the 5% threshold.

**Verify:**
- ✓ System detects out-of-range status
- ✓ Calculates new optimal range
- ✓ Correctly measures price movement (0%)
- ✓ Rejects rebalancing due to insufficient movement

---

## Test 4: Force Rebalance (Override Safety)

**Goal:** Test the --force flag to override safety recommendations

```bash
npm run dev -- rebalance --position position_DummyWal_2 --force
```

**Expected Output:**
```
Found position: RAY/SOL
  ...
  Status: ⚠️  Out of Range

Analyzing position...
Calculated new range for RAY/SOL:
  Current Price: $0.0250
  Old Range: $0.0200 - $0.0300
  New Range: $0.0225 - $0.0275 (±10%)

⚠️  Force rebalancing despite recommendation: Price movement (0.00%) below threshold (5%)

📋 Rebalance Plan:
  1. Close current position
     - Withdraw liquidity
     - Harvest pending fees ($5.75)
     - Receive ~5000.0000 RAY
     - Receive ~1.2500 SOL

  2. Create new position
     - New Range: $0.0225 - $0.0275
     - Redeposit all tokens
     - Estimated gas: $0.0030

🔧 Mock Mode: Simulating rebalance...

Step 1/2: Closing position...
  ✓ Position closed
  ✓ Harvested $5.75 in fees
  ✓ Withdrew 5000.0000 RAY
  ✓ Withdrew 1.2500 SOL

Step 2/2: Creating new position...
  ✓ New position created
  ✓ Range: $0.0225 - $0.0275
  ✓ Deposited 5000.0000 RAY
  ✓ Deposited 1.2500 SOL

Recorded rebalance for position position_DummyWal_2
✅ Mock rebalance completed successfully
```

**Verify:**
- ✓ Warning shows force override is active
- ✓ Detailed rebalance plan is shown
- ✓ Two-step process (close + create) is simulated
- ✓ Fees are harvested
- ✓ All tokens are moved to new position
- ✓ Rebalance is recorded (prevents immediate re-rebalance)

---

## Test 5: Custom Range Width

**Goal:** Test custom range configuration

```bash
npm run dev -- rebalance --position position_DummyWal_2 --force --range 15
```

**Expected Output:**
```
Calculated new range for RAY/SOL:
  Current Price: $0.0250
  Old Range: $0.0200 - $0.0300
  New Range: $0.0213 - $0.0288 (±15%)

  2. Create new position
     - New Range: $0.0213 - $0.0288
     ...
```

**Verify:**
- ✓ Range width changed to ±15% (instead of default ±10%)
- ✓ Calculations use the custom range percentage

---

## Test 6: Cooldown Protection

**Goal:** Verify the system prevents too-frequent rebalancing

**Step 1:** Force rebalance a position (from Test 4)
```bash
npm run dev -- rebalance --position position_DummyWal_2 --force
```

**Step 2:** Immediately try to rebalance again
```bash
npm run dev -- rebalance --position position_DummyWal_2 --force
```

**Expected Output:**
```
❌ Rebalancing NOT recommended
Reason: Too soon since last rebalance (60 min remaining)

Use --force to rebalance anyway
```

**Note:** Even with `--force`, the system still shows the recommendation. In the current implementation, `--force` will override this, but you'll see the warning.

**Verify:**
- ✓ System tracks last rebalance time
- ✓ Cooldown period is enforced (1 hour default)
- ✓ Clear message about time remaining

---

## Test 7: Automated Monitor (Short Run)

**Goal:** Test continuous monitoring with auto-rebalance

```bash
# Run monitor for 30 seconds, checking every 1 minute
# It will run immediately, then wait for next scheduled check
npm run dev -- monitor --interval 1
```

**Press Ctrl+C after ~10 seconds to stop**

**Expected Output:**
```
Starting LP Position Monitor
Wallet: DummyWalletForTestingWithMockData123456789
Check Interval: Every 1 minutes
Auto-Rebalance: Enabled
Auto-Compound: Enabled

[2025-12-25T20:14:50.502Z] Running position check...
⚠️  Position RAY/SOL is OUT OF RANGE
   Current Price: $0.0250
   Position Range: $0.0200 - $0.0300
   Value: $850.00
   → Auto-rebalancing enabled, analyzing...

Calculated new range for RAY/SOL:
  Current Price: $0.0250
  Old Range: $0.0200 - $0.0300
  New Range: $0.0225 - $0.0275 (±10%)

   ⏸️  Rebalancing not recommended: Price movement (0.00%) below threshold (5%)

💰 Total pending yield: $18.25
   → Auto-compound enabled, harvesting fees...
   → Compound logic not yet implemented

✓ Check complete. 2 positions monitored, 1 out of range

Scheduled to run every 1 minutes
Press Ctrl+C to stop monitoring

[Wait for next check...]
```

**Verify:**
- ✓ Monitor starts and shows configuration
- ✓ Immediate position check runs
- ✓ Out-of-range positions are detected
- ✓ Auto-rebalance analysis runs automatically
- ✓ Decision is made (rebalance or wait)
- ✓ Schedule shows next check time
- ✓ Ctrl+C stops gracefully

---

## Test 8: Monitor Without Auto-Rebalance

**Goal:** Test monitoring without automatic rebalancing

```bash
npm run dev -- monitor --interval 1 --no-rebalance
```

**Press Ctrl+C after ~10 seconds**

**Expected Output:**
```
Starting LP Position Monitor
...
Auto-Rebalance: Disabled
...

⚠️  Position RAY/SOL is OUT OF RANGE
   Current Price: $0.0250
   Position Range: $0.0200 - $0.0300
   Value: $850.00

✓ Check complete. 2 positions monitored, 1 out of range
```

**Verify:**
- ✓ Auto-Rebalance shows as "Disabled"
- ✓ Out-of-range positions are detected
- ✓ NO rebalance analysis is run
- ✓ No rebalancing occurs

---

## Test 9: Invalid Position ID

**Goal:** Test error handling for non-existent positions

```bash
npm run dev -- rebalance --position invalid_position_123
```

**Expected Output:**
```
Found position details...
Position invalid_position_123 not found
Available positions:
  - position_DummyWal_1 (SOL/USDC)
  - position_DummyWal_2 (RAY/SOL)
```

**Verify:**
- ✓ Clear error message
- ✓ Lists available positions
- ✓ Graceful exit (no crash)

---

## Test 10: Review Documentation

**Goal:** Familiarize yourself with the system

```bash
# View the auto-rebalance documentation
cat backend/docs/AUTO_REBALANCE.md
```

**Review these sections:**
- Configuration options
- Safety mechanisms
- Price movement calculation
- Best practices
- Troubleshooting guide

---

## Testing Checklist

After running all tests, verify:

- [ ] Basic position viewing works
- [ ] In-range positions correctly skip rebalancing
- [ ] Out-of-range detection works
- [ ] Price movement threshold is enforced
- [ ] Force flag overrides safety checks
- [ ] Custom range widths work
- [ ] Cooldown protection prevents over-trading
- [ ] Monitor runs continuously
- [ ] Auto-rebalance integrates with monitor
- [ ] Flags (--no-rebalance, --no-compound) work
- [ ] Error handling is graceful
- [ ] Documentation is comprehensive

---

## Advanced Testing Scenarios

### Scenario A: Simulate Significant Price Movement

To test a case where rebalancing WOULD be recommended, you'd need to modify the mock data to have a position where price has moved >5% outside the range.

**Modify:** `backend/src/services/raydium-mock.service.ts`

Change position 2 to have significant price movement:
```typescript
{
  id: 'position_DummyWal_2',
  poolName: 'RAY/SOL',
  currentPrice: 0.0350,  // Changed from 0.0250
  priceMin: 0.02,
  priceMax: 0.03,
  isOutOfRange: true,
  // ... rest stays same
}
```

Now the movement would be:
- Range center: $0.025
- Current price: $0.035
- Movement: (($0.035 - $0.03) / $0.025) * 100 = 20%
- Result: ✅ Exceeds 5% threshold!

**Then run:**
```bash
npm run dev -- rebalance --position position_DummyWal_2
```

**Expected:** System WILL recommend rebalancing!

### Scenario B: Test with Real Blockchain Data

**Prerequisites:**
- Funded Solana wallet
- WALLET_PRIVATE_KEY in .env
- Real positions in Raydium pools

```bash
# Use real on-chain data
npm run dev -- status --real
npm run dev -- rebalance --position <REAL_POSITION_ID> --real
```

**Warning:** This fetches real data but still only simulates rebalancing. No actual transactions are sent.

---

## Troubleshooting Tests

### Issue: "Module not found" errors
**Solution:** Run `npm install` in backend directory

### Issue: TypeScript errors
**Solution:** Run `npm run type-check` to identify issues

### Issue: Mock data doesn't match examples
**Solution:** Check `backend/src/services/raydium-mock.service.ts` for current mock data

### Issue: Monitor won't stop with Ctrl+C
**Solution:** Use `Ctrl+C` again or `ps aux | grep tsx` and kill the process

---

## Next Steps After Testing

Once you've validated the auto-rebalance system works correctly:

1. **Customize Configuration** - Adjust thresholds in `rebalance-strategy.ts`
2. **Test with Real Positions** - Use `--real` flag with actual wallet
3. **Implement Real Transactions** - Build on-chain execution logic
4. **Deploy for Production** - Set up server with continuous monitoring
5. **Add Notifications** - Integrate webhooks/email for rebalance events

---

## Feedback & Issues

As you test, note any issues or unexpected behavior. Common areas to watch:

- Decision logic clarity
- Error message helpfulness
- Performance with many positions
- Gas estimation accuracy
- Documentation completeness

Happy testing! 🧪
