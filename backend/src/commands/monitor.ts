import { Connection } from '@solana/web3.js'
import cron from 'node-cron'
import logger from '../utils/logger'
import config from '../config'
import raydiumService from '../services/raydium-mock.service'

interface MonitorOptions {
  interval: string
  rebalance: boolean
  compound: boolean
}

export async function monitorCommand(options: MonitorOptions) {
  const connection = new Connection(config.solana.rpcUrl, 'confirmed')
  const walletAddress = config.wallet.publicKey

  if (!walletAddress) {
    logger.error('No wallet address configured. Set WALLET_PUBLIC_KEY in .env')
    process.exit(1)
  }

  const intervalMinutes = parseInt(options.interval)
  const cronSchedule = `*/${intervalMinutes} * * * *`

  logger.info('Starting LP Position Monitor')
  logger.info(`Wallet: ${walletAddress}`)
  logger.info(`Check Interval: Every ${intervalMinutes} minutes`)
  logger.info(`Auto-Rebalance: ${options.rebalance ? 'Enabled' : 'Disabled'}`)
  logger.info(`Auto-Compound: ${options.compound ? 'Enabled' : 'Disabled'}`)
  logger.info('')

  // Run immediately on start
  await monitorCheck(walletAddress, options)

  // Schedule periodic checks
  logger.info(`Scheduled to run every ${intervalMinutes} minutes`)
  logger.info('Press Ctrl+C to stop monitoring\n')

  cron.schedule(cronSchedule, async () => {
    await monitorCheck(walletAddress, options)
  })

  // Keep the process running
  process.on('SIGINT', () => {
    logger.info('\nStopping monitor...')
    process.exit(0)
  })
}

async function monitorCheck(walletAddress: string, options: MonitorOptions) {
  const timestamp = new Date().toISOString()
  logger.info(`[${timestamp}] Running position check...`)

  try {
    const positions = await raydiumService.getWalletPositions(walletAddress)

    if (positions.length === 0) {
      logger.info('No positions found')
      return
    }

    let outOfRangeCount = 0
    let totalPendingYield = 0

    for (const position of positions) {
      const isInRange = position.status === 'active'
      totalPendingYield += position.pendingYield

      if (!isInRange) {
        outOfRangeCount++
        logger.warn(`⚠️  Position ${position.poolName} is OUT OF RANGE`)
        logger.warn(`   Current Price: $${position.currentPrice.toFixed(4)}`)
        logger.warn(`   Position Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)

        if (options.rebalance) {
          logger.info(`   → Auto-rebalancing enabled, will rebalance...`)
          // TODO: Implement auto-rebalance
          logger.info(`   → Rebalance logic not yet implemented`)
        }
      }
    }

    // Check if we should compound fees
    if (options.compound && totalPendingYield > 10) {
      logger.info(`💰 Total pending yield: $${totalPendingYield.toFixed(2)}`)
      logger.info(`   → Auto-compound enabled, harvesting fees...`)
      // TODO: Implement auto-compound
      logger.info(`   → Compound logic not yet implemented`)
    }

    logger.info(`✓ Check complete. ${positions.length} positions monitored, ${outOfRangeCount} out of range\n`)

  } catch (error) {
    logger.error('Error during monitor check:', error)
  }
}
