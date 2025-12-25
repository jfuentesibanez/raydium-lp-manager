# Testing Guide - Raydium LP Manager

This guide will walk you through testing all features of the application.

## Prerequisites

Before testing, ensure you have:
- ✅ Node.js installed (v18+)
- ✅ PostgreSQL running
- ✅ Redis running
- ✅ Phantom wallet browser extension installed
- ✅ Dependencies installed (`npm install` in root)

## Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output**:
```
Server running on port 4000
Environment: development
Solana Network: devnet
Database connection established
```

**Verify backend is running**:
```bash
curl http://localhost:4000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "database": "connected",
  "dbTime": "..."
}
```

### 2. Start Frontend Server

In a new terminal:
```bash
cd frontend
npm run dev
```

**Expected output**:
```
VITE v6.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 3. Open Browser

Navigate to: **http://localhost:3000**

## Test Checklist

### ✅ Phase 1: Initial Load

**Test**: Application loads correctly

1. Open http://localhost:3000
2. ✓ Page loads without errors
3. ✓ Header displays "Raydium LP Manager"
4. ✓ "Connect Wallet" button visible
5. ✓ Empty state message: "Connect Your Wallet"
6. ✓ No console errors (F12 → Console tab)

**Expected Result**: Clean UI with dark theme, no errors

---

### ✅ Phase 2: Wallet Connection

**Test**: Phantom wallet integration

1. Click "Connect Wallet" button
2. ✓ Phantom popup appears
3. ✓ Select your wallet and approve
4. ✓ Wallet button changes to show your address (e.g., "5k3d...Xy7z")
5. ✓ SOL balance displays in header
6. ✓ Dashboard content appears

**Expected Result**: Wallet connected, balance shown, dashboard visible

**Troubleshooting**:
- If Phantom doesn't open: Check extension is installed and unlocked
- If balance shows 0: Normal on devnet, use mainnet for real balance

---

### ✅ Phase 3: Portfolio Overview

**Test**: Dashboard statistics display

With wallet connected:

1. ✓ "Portfolio Overview" heading visible
2. ✓ Four stat cards display:
   - Total Portfolio Value
   - Active Positions
   - Pending Yield
   - Average APR
3. ✓ Cards show $0.00 or mock data
4. ✓ "Create New Position" button visible
5. ✓ "Active Positions" section appears

**Expected Result**: Clean stats display, all cards rendering

---

### ✅ Phase 4: Position Display

**Test**: Mock positions load and display

1. ✓ API call to `/api/positions/live/YOUR_WALLET` succeeds
2. ✓ 2 mock positions display (SOL/USDC and RAY/SOL)
3. ✓ Each position card shows:
   - Pool name
   - Position ID
   - Total value
   - Token amounts
   - Current price
   - Price range
   - APR
   - Pending yield
   - Action buttons (Add, Remove, Harvest, Close)
4. ✓ One position marked "Out of Range" (orange badge)
5. ✓ Refresh button works

**Expected Result**: Two position cards with complete data

**Check in DevTools**:
```javascript
// Network tab should show:
GET /api/positions/live/YOUR_WALLET_ADDRESS
Status: 200
Response: [array of 2 positions]
```

---

### ✅ Phase 5: Pool Browsing

**Test**: Available pools display

1. Scroll to "Browse Pools" section
2. ✓ Pool table displays
3. ✓ 4 pools shown:
   - SOL/USDC
   - SOL/USDT
   - RAY/SOL
   - mSOL/SOL
4. ✓ Each pool shows:
   - Pool name
   - Price
   - TVL
   - Volume 24h
   - APR (in green)
5. ✓ Refresh button works

**Expected Result**: Table with 4 pools and complete data

---

### ✅ Phase 6: Create Position Modal - Opening

**Test**: Modal opens correctly

1. Click "Create New Position" button (top right)
2. ✓ Modal appears with backdrop
3. ✓ Modal title: "Create Liquidity Position"
4. ✓ Pool dropdown shows 4 pools
5. ✓ SOL/USDC selected by default
6. ✓ Current price displays (~$100.50)
7. ✓ Four range preset buttons visible (±5%, ±10%, ±20%, Custom)
8. ✓ ±10% selected by default (Medium)
9. ✓ Min/Max price inputs auto-filled
10. ✓ Token input fields empty

**Expected Result**: Modal opens, form ready for input

---

### ✅ Phase 7: Create Position - Range Selection

**Test**: Price range presets work

1. **Test ±5% (Narrow)**:
   - Click "±5%" button
   - ✓ Button highlights blue
   - ✓ Min price: ~95.47
   - ✓ Max price: ~105.52

2. **Test ±10% (Medium)**:
   - Click "±10%" button
   - ✓ Min price: ~90.45
   - ✓ Max price: ~110.55

3. **Test ±20% (Wide)**:
   - Click "±20%" button
   - ✓ Min price: ~80.40
   - ✓ Max price: ~120.60

4. **Test Custom**:
   - Click in Min Price field
   - ✓ "Custom" button auto-highlights
   - Enter custom value (e.g., 85)
   - ✓ Custom button stays highlighted

**Expected Result**: Range presets work, custom detection works

---

### ✅ Phase 8: Create Position - Token Amounts

**Test**: Auto-calculation of token amounts

1. Enter SOL amount: **1**
2. ✓ USDC auto-calculates to ~100.25
3. ✓ Preview section appears showing:
   - Position Value: ~$200.50
   - Estimated APR: 28.50%
   - Status: In Range (green)

4. Change SOL amount to: **5**
5. ✓ USDC updates to ~501.25
6. ✓ Position Value updates to ~$1,002.50

7. Manually change USDC to: **1000**
8. ✓ SOL stays at 5 (auto-calc disabled)
9. ✓ Position Value updates

**Expected Result**: Smart auto-calculation works, preview updates

---

### ✅ Phase 9: Create Position - Validation

**Test**: Form validation works

1. **Test Empty Fields**:
   - Clear all inputs
   - Click "Create Position"
   - ✓ Error toast: "Please enter valid token amounts"

2. **Test Invalid Range**:
   - Min Price: 100
   - Max Price: 90
   - ✓ Error toast: "Lower price must be less than upper price"

3. **Test Out of Range Warning**:
   - Min Price: 110
   - Max Price: 120
   - ✓ Orange warning appears: "Position will be out of range"
   - ✓ Status shows: "Out of Range" (orange)
   - Enter amounts: 1 SOL
   - Click "Create Position"
   - ✓ Warning toast appears but continues

**Expected Result**: All validation rules work

---

### ✅ Phase 10: Create Position - Transaction Flow

**Test**: Position creation transaction

1. Set up valid position:
   - Pool: SOL/USDC
   - Range: ±10%
   - SOL: 1
   - USDC: ~100 (auto-calculated)

2. Click "Create Position"
3. ✓ Toast: "Building transaction..." with ⚙️
4. ✓ Toast: "Estimated fee: 0.0020 SOL" with ℹ️
5. ✓ Toast: "Waiting for wallet approval..." with 👛
6. ✓ Button shows "Creating..."
7. ✓ Toast: "Sending transaction..." with 📡
8. ✓ Wait ~3 seconds (simulated)
9. ✓ Success toast: "Position created successfully!" with position ID
10. ✓ Modal closes
11. ✓ Dashboard refreshes
12. ✓ (Note: Position won't actually appear since it's mock)

**Expected Result**: Complete transaction flow with feedback

---

### ✅ Phase 11: Position Actions

**Test**: Action buttons on position cards

1. Find a position card (SOL/USDC)

2. **Test Add Liquidity**:
   - Click "Add" button
   - ✓ Toast appears (feature not implemented yet)

3. **Test Remove Liquidity**:
   - Click "Remove" button
   - ✓ Toast appears

4. **Test Harvest**:
   - Click "Harvest" button
   - ✓ Toast appears (only enabled if pending yield > 0)

5. **Test Close**:
   - Click "Close" button
   - ✓ Toast appears with red styling

**Expected Result**: All buttons clickable, toasts appear

---

### ✅ Phase 12: Responsive Design

**Test**: Mobile/tablet responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro"
4. ✓ Layout adjusts for mobile
5. ✓ Cards stack vertically
6. ✓ Modal fits on screen
7. ✓ All buttons accessible

**Test tablet**: Select "iPad Pro"
8. ✓ Two-column grid for position cards
9. ✓ Modal wider but still centered

**Expected Result**: Responsive at all breakpoints

---

### ✅ Phase 13: API Endpoints

**Test**: Backend API responses

Open a new terminal and test endpoints:

```bash
# Health check
curl http://localhost:4000/api/health

# Popular pools
curl http://localhost:4000/api/pools/popular

# Specific pool
curl http://localhost:4000/api/pools/61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht

# Positions (replace with your wallet address)
curl http://localhost:4000/api/positions/live/YOUR_WALLET_ADDRESS

# Build transaction (POST - use Postman or curl with data)
curl -X POST http://localhost:4000/api/transactions/build/create-position \
  -H "Content-Type: application/json" \
  -d '{
    "poolAddress": "pool1",
    "walletAddress": "wallet1",
    "tickLower": -20000,
    "tickUpper": 20000,
    "amount0Desired": 1,
    "amount1Desired": 100,
    "amount0Min": 0.95,
    "amount1Min": 95,
    "slippage": 0.5
  }'
```

**Expected Results**: All endpoints return 200 with JSON data

---

## Common Issues & Fixes

### Issue: Backend won't start

**Error**: `Database connection failed`

**Fix**:
```bash
# Check PostgreSQL is running
pg_isready

# If not running:
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux
```

**Fix**: Database doesn't exist
```bash
createdb raydium_lp_manager
cd backend
npm run build
node dist/database/init.js
```

---

### Issue: Frontend won't start

**Error**: `Module not found`

**Fix**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Wallet won't connect

**Error**: Phantom doesn't popup

**Fix**:
1. Install Phantom extension
2. Create/import a wallet
3. Unlock the wallet
4. Refresh page and try again

---

### Issue: Positions don't load

**Error**: Network error or empty array

**Check**:
1. Backend is running on port 4000
2. Check browser console for errors
3. Check Network tab in DevTools
4. Verify CORS is working (should see requests succeed)

**Fix**: CORS error
```typescript
// backend/src/app.ts
app.use(cors({
  origin: 'http://localhost:3000',  // Verify this matches
  credentials: true,
}))
```

---

## Performance Tests

### Load Time
- Initial page load: < 2 seconds
- Wallet connection: < 1 second
- Position fetch: < 1 second
- Modal open: Instant

### No Memory Leaks
1. Open/close modal 10 times
2. Check memory in DevTools Performance tab
3. ✓ Memory should stabilize, not continuously grow

---

## Success Criteria

All features working if:
- ✅ Backend starts without errors
- ✅ Frontend loads correctly
- ✅ Wallet connects successfully
- ✅ Positions display (mock data)
- ✅ Pools table shows 4 pools
- ✅ Create Position modal opens
- ✅ Form validation works
- ✅ Transaction flow completes
- ✅ No console errors
- ✅ Responsive design works
- ✅ All API endpoints respond

---

## Next Steps After Testing

Once testing is complete and all features work:

1. **Document any bugs found**
2. **Note performance issues**
3. **Identify missing features**
4. **Plan next development phase**

---

## Testing Completion Checklist

Mark each as you test:

- [ ] Backend starts successfully
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] Portfolio overview displays
- [ ] Mock positions load and display
- [ ] Pools table shows correctly
- [ ] Create Position modal opens
- [ ] Range presets work
- [ ] Token auto-calculation works
- [ ] Form validation catches errors
- [ ] Transaction flow completes
- [ ] Position action buttons respond
- [ ] Responsive design works
- [ ] No console errors
- [ ] All API endpoints work

**Testing completed by**: _________________
**Date**: _________________
**Issues found**: _________________
