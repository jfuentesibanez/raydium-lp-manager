# Railway Deployment Guide

This guide will walk you through deploying your Raydium LP auto-rebalance bot to Railway.

## Prerequisites

- ✅ Railway account (https://railway.app)
- ✅ GitHub repository with your code pushed
- ✅ Solana wallet with positions (or test with mock data)

## Step-by-Step Deployment

### 1. Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository: `jfuentesibanez/raydium-lp-manager`

### 2. Configure the Service

Railway will auto-detect your Node.js project. Configure these settings:

1. **Root Directory**: Set to `backend`
   - Click on your service
   - Go to **Settings** tab
   - Under **Source**, set **Root Directory** to `backend`

2. **Build Configuration**:
   - Railway will automatically use `npm run build`
   - Start command will be `npm run start:prod` (from railway.toml)

### 3. Set Environment Variables

Click on the **Variables** tab and add these environment variables:

#### Required Variables

```bash
# Solana Network
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet

# Your Wallet (for viewing positions)
WALLET_PUBLIC_KEY=<your_wallet_public_key>

# Optional: For real transaction execution (NOT NEEDED YET)
# WALLET_PRIVATE_KEY=<your_base58_private_key>
```

#### Optional Configuration

```bash
# Monitor interval (minutes)
MONITOR_INTERVAL=5

# Rebalance thresholds
PRICE_MOVEMENT_THRESHOLD=5
DEFAULT_RANGE_PERCENT=10
MIN_REBALANCE_INTERVAL=3600000
MAX_GAS_COST_USD=5
MIN_POSITION_VALUE_USD=100
```

### 4. Deploy

1. Click **"Deploy"** button
2. Railway will:
   - Clone your repository
   - Install dependencies
   - Build TypeScript
   - Start the monitor

3. Monitor deployment progress in the **Deployments** tab

### 5. Verify It's Running

1. Go to **Logs** tab
2. You should see output like:

```
Starting LP Position Monitor
Wallet: <your_wallet>...
Check Interval: Every 5 minutes
Auto-Rebalance: Enabled
Auto-Compound: Enabled

[2025-12-25T20:14:50.502Z] Running position check...
Found 2 position(s)
✓ Check complete. 2 positions monitored, 1 out of range
```

### 6. Monitor Logs

Railway provides real-time logs. You can:
- View live position checks
- See rebalance decisions
- Monitor errors or issues

## Cost Estimation

### Railway Free Tier
- ✅ $5 free credit per month
- ✅ Unlimited projects
- ✅ 512MB RAM, 1GB disk
- ✅ Auto-sleep after inactivity (won't affect monitoring)

This bot uses minimal resources:
- **CPU**: Very low (only runs every 5 min)
- **RAM**: ~50-100MB
- **Network**: Minimal (only API calls to Solana RPC)

**Estimated cost**: $0-2/month (well within free tier)

## Production Considerations

### 1. Using Mock vs Real Data

By default, the bot uses **mock data** for safety.

To use **real blockchain data**:
- You don't need to change anything
- The bot currently only reads positions (no transactions)
- It's safe to monitor real positions

### 2. Auto-Rebalance Safety

Currently configured to:
- ✅ Analyze positions automatically
- ✅ Make rebalance recommendations
- ⚠️ Only SIMULATE rebalances (no real transactions)

This is intentional for safety. Actual on-chain rebalancing needs to be implemented.

### 3. Monitoring Interval

The default is 5 minutes. Adjust based on:
- **Volatile pools**: Check every 1-2 minutes
- **Stable pools**: Check every 10-15 minutes
- **Gas costs**: More frequent = more API calls

Edit `railway.toml` or environment variable `MONITOR_INTERVAL`.

### 4. Notifications (Optional)

Currently, the bot only logs to Railway. To get notifications:

**Option A: Railway Webhooks**
- Set up webhook to notify on errors
- Use services like Discord, Slack, Telegram

**Option B: Custom Notifications**
- Modify `monitor.ts` to send alerts
- Use email, SMS, or push notifications
- Implement in future updates

## Troubleshooting

### Build Fails

**Error**: `Cannot find module 'X'`
- Solution: Make sure `package.json` includes all dependencies
- Run `npm install` locally first

**Error**: `TypeScript compilation failed`
- Solution: Run `npm run type-check` locally
- Fix any TypeScript errors before deploying

### Service Crashes

**Error**: `ECONNREFUSED` or network errors
- Solution: Check `SOLANA_RPC_URL` is valid
- Consider using a private RPC (Helius, QuickNode)

**Error**: `Wallet not found`
- Solution: Verify `WALLET_PUBLIC_KEY` is set correctly
- Check it's a valid Solana address

### Monitor Not Running

**Symptom**: No logs appearing
- Check **Logs** tab in Railway
- Verify start command is `npm run start:prod`
- Check root directory is set to `backend`

### Using Too Much Resources

**Symptom**: Railway usage alerts
- Increase `MONITOR_INTERVAL` (check less frequently)
- Use Railway's sleep/wake features
- Upgrade to paid plan if needed

## Updating Your Deployment

When you make changes:

1. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push
   ```

2. **Railway auto-deploys**:
   - Watches your `main` branch
   - Automatically rebuilds and redeploys
   - Zero downtime deployments

3. **Manual redeploy**:
   - Click **"Redeploy"** in Railway dashboard
   - Or trigger via Railway CLI

## Advanced: Using Railway CLI

Install Railway CLI for more control:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link to your project
cd backend
railway link

# View logs
railway logs

# Set variables
railway variables set MONITOR_INTERVAL=3

# Deploy manually
railway up
```

## Security Best Practices

### 1. Environment Variables
- ✅ **NEVER** commit `.env` files
- ✅ Use Railway's encrypted variables
- ✅ Rotate keys regularly

### 2. Private Keys
- ⚠️ Only add `WALLET_PRIVATE_KEY` when ready for real transactions
- ⚠️ Use a dedicated wallet for automated trading
- ⚠️ Only fund with amount you're comfortable with

### 3. Access Control
- Set Railway project to private
- Don't share deployment URLs
- Use Railway Teams for shared access

## Monitoring Dashboard (Future)

Consider adding:
- Web dashboard to view status
- API endpoint for health checks
- Metrics tracking (rebalances, fees earned)
- Alerts on errors or opportunities

## Support

If you encounter issues:

1. **Check Railway Logs**: Most issues show here
2. **Review Documentation**: `docs/AUTO_REBALANCE.md`
3. **Test Locally**: Run `npm run monitor` locally first
4. **GitHub Issues**: Report bugs in your repo

## Next Steps

After deployment:

1. ✅ Monitor logs for first 24 hours
2. ✅ Verify position checks are working
3. ✅ Test rebalance decision-making
4. 🔜 Implement real on-chain transactions
5. 🔜 Add notification system
6. 🔜 Build monitoring dashboard

---

**Congratulations!** 🎉 Your Raydium LP auto-rebalance bot is now running 24/7 on Railway!

**Quick Links**:
- Railway Dashboard: https://railway.app/dashboard
- Documentation: `docs/AUTO_REBALANCE.md`
- Testing Guide: `TESTING_GUIDE.md`
