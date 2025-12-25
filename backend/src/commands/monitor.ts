import cron from 'node-cron'
import logger from '../utils/logger'
import config from '../config'
import raydiumService from '../services/raydium.service'
import { createRebalanceStrategy, PositionInfo } from '../core/rebalance-strategy'
import telegramService from '../services/telegram.service'

interface MonitorOptions {
  interval: string
  rebalance: boolean
  compound: boolean
}

// Global rebalance strategy instance
const rebalanceStrategy = createRebalanceStrategy()

export async function monitorCommand(options: MonitorOptions) {
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

  // Send Telegram startup notification
  await telegramService.sendStartupMessage()

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
    let totalValue = 0

    for (const position of positions) {
      const isInRange = !position.isOutOfRange
      totalPendingYield += position.pendingFeesUSD
      totalValue += position.totalValueUSD

      if (!isInRange) {
        outOfRangeCount++
        logger.warn(`⚠️  Position ${position.poolName} is OUT OF RANGE`)
        logger.warn(`   Current Price: $${position.currentPrice.toFixed(4)}`)
        logger.warn(`   Position Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
        logger.warn(`   Value: $${position.totalValueUSD.toFixed(2)}`)

        if (options.rebalance) {
          logger.info(`   → Auto-rebalancing enabled, analyzing...`)

          // Check if rebalancing is recommended
          const positionInfo: PositionInfo = {
            id: position.id,
            poolName: position.poolName,
            currentPrice: position.currentPrice,
            priceMin: position.priceMin,
            priceMax: position.priceMax,
            totalValueUSD: position.totalValueUSD,
            isOutOfRange: position.isOutOfRange,
            liquidity: position.liquidity,
            token0Amount: position.token0Amount,
            token1Amount: position.token1Amount,
            pendingFeesUSD: position.pendingFeesUSD,
          }

          const decision = rebalanceStrategy.shouldRebalance(positionInfo)

          // Send Telegram alert for any out-of-range position with rebalance analysis
          await telegramService.sendRebalanceAlert(positionInfo, decision)

          if (decision.shouldRebalance) {
            logger.info(`   ✓ Rebalancing recommended: ${decision.reason}`)
            logger.info(`   → Simulating rebalance...`)

            try {
              await simulateAutoRebalance(position, decision.newPriceMin!, decision.newPriceMax!)
              rebalanceStrategy.recordRebalance(position.id)
              logger.info(`   ✅ Position rebalanced successfully`)
            } catch (error) {
              logger.error(`   ❌ Rebalance failed:`, error)
            }
          } else {
            logger.info(`   ⏸️  Rebalancing not recommended: ${decision.reason}`)
          }
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

    // Send Telegram summary (only if there are positions)
    if (positions.length > 0) {
      await telegramService.sendCheckSummary(
        positions.length,
        outOfRangeCount,
        totalValue,
        totalPendingYield
      )
    }

  } catch (error) {
    logger.error('Error during monitor check:', error)
    // Send error notification to Telegram
    await telegramService.sendError(error instanceof Error ? error.message : String(error))
  }
}

/**
 * Simulate auto-rebalance within monitor
 */
async function simulateAutoRebalance(
  position: any,
  newPriceMin: number,
  newPriceMax: number
): Promise<void> {
  logger.info(`     Closing position ${position.id.slice(0, 8)}...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  logger.info(`     Creating new position with range $${newPriceMin.toFixed(4)} - $${newPriceMax.toFixed(4)}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}
