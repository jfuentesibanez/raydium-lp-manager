import logger from '../utils/logger'
import config from '../config'
import raydiumMockService from '../services/raydium-mock.service'
import raydiumRealService from '../services/raydium.service'
import { createRebalanceStrategy, PositionInfo } from '../core/rebalance-strategy'

interface RebalanceOptions {
  position: string
  range?: string
  real?: boolean
  force?: boolean
}

export async function rebalanceCommand(options: RebalanceOptions) {
  logger.info('🔄 Rebalance Position')
  logger.info(`Position ID: ${options.position}`)

  const walletAddress = config.wallet.publicKey

  if (!walletAddress) {
    logger.error('No wallet address configured. Set WALLET_PUBLIC_KEY in .env')
    process.exit(1)
  }

  // Choose service
  const raydiumService = options.real ? raydiumRealService : raydiumMockService
  const dataSource = options.real ? 'REAL on-chain data' : 'MOCK data'

  logger.info(`Data source: ${dataSource}`)
  logger.info('')

  try {
    // 1. Fetch all positions to find the target position
    logger.info('Fetching position details...')
    const positions = await raydiumService.getWalletPositions(walletAddress)

    const position = positions.find(p => p.id === options.position)

    if (!position) {
      logger.error(`Position ${options.position} not found`)
      logger.info('Available positions:')
      positions.forEach(p => {
        logger.info(`  - ${p.id} (${p.poolName})`)
      })
      process.exit(1)
    }

    logger.info(`Found position: ${position.poolName}`)
    logger.info(`  Current Value: $${position.totalValueUSD.toFixed(2)}`)
    logger.info(`  Current Price: $${position.currentPrice.toFixed(4)}`)
    logger.info(`  Price Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
    logger.info(`  Status: ${position.isOutOfRange ? '⚠️  Out of Range' : '✓ In Range'}`)
    logger.info('')

    // 2. Create rebalance strategy
    const customRange = options.range ? parseInt(options.range) : undefined
    const strategy = createRebalanceStrategy(
      customRange ? { defaultRangePercent: customRange } : undefined
    )

    // 3. Get rebalance decision
    logger.info('Analyzing position...')
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

    const decision = strategy.shouldRebalance(positionInfo)
    logger.info('')

    if (!decision.shouldRebalance && !options.force) {
      logger.warn(`❌ Rebalancing NOT recommended`)
      logger.warn(`Reason: ${decision.reason}`)
      logger.info('')
      logger.info('Use --force to rebalance anyway')
      return
    }

    if (options.force && !decision.shouldRebalance) {
      logger.warn(`⚠️  Force rebalancing despite recommendation: ${decision.reason}`)
    } else {
      logger.info(`✓ Rebalancing recommended: ${decision.reason}`)
    }

    logger.info('')

    // 4. Show rebalance plan
    logger.info('📋 Rebalance Plan:')
    logger.info(`  1. Close current position`)
    logger.info(`     - Withdraw liquidity`)
    logger.info(`     - Harvest pending fees ($${position.pendingFeesUSD.toFixed(2)})`)
    logger.info(`     - Receive ~${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
    logger.info(`     - Receive ~${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
    logger.info('')
    logger.info(`  2. Create new position`)
    logger.info(`     - New Range: $${decision.newPriceMin?.toFixed(4)} - $${decision.newPriceMax?.toFixed(4)}`)
    logger.info(`     - Redeposit all tokens`)
    logger.info(`     - Estimated gas: $${decision.estimatedGasCost?.toFixed(4)}`)
    logger.info('')

    // 5. Execute rebalance (currently mock)
    if (!options.real) {
      logger.info('🔧 Mock Mode: Simulating rebalance...')
      await simulateRebalance(position, decision.newPriceMin!, decision.newPriceMax!)
      strategy.recordRebalance(position.id)
      logger.info('✅ Mock rebalance completed successfully')
    } else {
      logger.warn('⚠️  Real blockchain rebalancing not yet implemented')
      logger.info('This would execute actual on-chain transactions:')
      logger.info('  1. Close position transaction')
      logger.info('  2. Create position transaction')
      logger.info('')
      logger.info('Implementation needed:')
      logger.info('  - Build close position instruction')
      logger.info('  - Build create position instruction')
      logger.info('  - Sign and send transactions')
      logger.info('  - Wait for confirmations')
    }

  } catch (error) {
    logger.error('Error during rebalance:', error)
    throw error
  }
}

/**
 * Simulate rebalance for testing
 */
async function simulateRebalance(
  position: any,
  newPriceMin: number,
  newPriceMax: number
): Promise<void> {
  // Simulate transaction delays
  logger.info('')
  logger.info('Step 1/2: Closing position...')
  await new Promise(resolve => setTimeout(resolve, 1500))
  logger.info('  ✓ Position closed')
  logger.info(`  ✓ Harvested $${position.pendingFeesUSD.toFixed(2)} in fees`)
  logger.info(`  ✓ Withdrew ${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
  logger.info(`  ✓ Withdrew ${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
  logger.info('')

  logger.info('Step 2/2: Creating new position...')
  await new Promise(resolve => setTimeout(resolve, 1500))
  logger.info(`  ✓ New position created`)
  logger.info(`  ✓ Range: $${newPriceMin.toFixed(4)} - $${newPriceMax.toFixed(4)}`)
  logger.info(`  ✓ Deposited ${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
  logger.info(`  ✓ Deposited ${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
  logger.info('')
}
