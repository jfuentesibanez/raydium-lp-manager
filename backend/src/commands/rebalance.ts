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
  console.log('\n╔════════════════════════════════════════════════════════════════════════╗')
  console.log('║              REBALANCE POSITION ANALYSIS                               ║')
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n')

  const walletAddress = config.wallet.publicKey

  if (!walletAddress) {
    console.error('❌ No wallet address configured. Set WALLET_PUBLIC_KEY in .env\n')
    process.exit(1)
  }

  // Choose service
  const raydiumService = options.real ? raydiumRealService : raydiumMockService
  const dataSource = options.real ? 'REAL on-chain data' : 'MOCK data'

  console.log(`🎯 Position ID: ${options.position}`)
  console.log(`📊 Data Source: ${dataSource}\n`)

  try {
    // 1. Fetch all positions to find the target position
    console.log('🔍 Fetching position details...\n')
    const positions = await raydiumService.getWalletPositions(walletAddress)

    const position = positions.find(p => p.id === options.position)

    if (!position) {
      console.error(`❌ Position ${options.position} not found\n`)
      console.log('Available positions:')
      positions.forEach(p => {
        console.log(`  • ${p.id} (${p.poolName})`)
      })
      console.log()
      process.exit(1)
    }

    console.log('─'.repeat(74))
    console.log(`\n📍 ${position.poolName}`)
    console.log(`   Value:        $${position.totalValueUSD.toFixed(2)}`)
    console.log(`   Current Price: $${position.currentPrice.toFixed(4)}`)
    console.log(`   Price Range:   $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
    console.log(`   Status:        ${position.isOutOfRange ? '🔴 Out of Range' : '🟢 In Range'}`)
    console.log()

    // 2. Create rebalance strategy
    const customRange = options.range ? parseInt(options.range) : undefined
    const strategy = createRebalanceStrategy(
      customRange ? { defaultRangePercent: customRange } : undefined
    )

    // 3. Get rebalance decision
    console.log('🤖 Analyzing position...')
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
    console.log()

    if (!decision.shouldRebalance && !options.force) {
      console.log('═'.repeat(74))
      console.log('\n❌ REBALANCING NOT RECOMMENDED\n')
      console.log(`💡 Reason: ${decision.reason}`)
      console.log(`💰 New Range: $${decision.newPriceMin?.toFixed(4)} - $${decision.newPriceMax?.toFixed(4)}`)
      console.log(`⛽ Est. Gas: $${decision.estimatedGasCost?.toFixed(4)}`)
      console.log('\n💡 Tip: Use --force to rebalance anyway')
      console.log('═'.repeat(74))
      console.log()
      return
    }

    if (options.force && !decision.shouldRebalance) {
      console.log('⚠️  FORCE MODE: Overriding safety recommendation')
      console.log(`   ${decision.reason}\n`)
    } else {
      console.log('✅ REBALANCING RECOMMENDED')
      console.log(`   ${decision.reason}\n`)
    }

    // 4. Show rebalance plan
    console.log('═'.repeat(74))
    console.log('\n📋 REBALANCE PLAN\n')
    console.log('─'.repeat(74))
    console.log('\n  STEP 1: Close Current Position')
    console.log(`     • Withdraw all liquidity`)
    console.log(`     • Harvest pending fees: $${position.pendingFeesUSD.toFixed(2)}`)
    console.log(`     • Receive: ~${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
    console.log(`     • Receive: ~${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
    console.log()
    console.log('  STEP 2: Create New Position')
    console.log(`     • New Range: $${decision.newPriceMin?.toFixed(4)} - $${decision.newPriceMax?.toFixed(4)}`)
    console.log(`     • Redeposit all tokens`)
    console.log(`     • Estimated gas: $${decision.estimatedGasCost?.toFixed(4)}`)
    console.log('\n' + '═'.repeat(74) + '\n')

    // 5. Execute rebalance (currently mock)
    if (!options.real) {
      console.log('🔧 MOCK MODE: Simulating rebalance...\n')
      await simulateRebalance(position, decision.newPriceMin!, decision.newPriceMax!)
      strategy.recordRebalance(position.id)
      console.log('✅ Mock rebalance completed successfully\n')
    } else {
      console.log('⚠️  REAL MODE: Not yet implemented\n')
      console.log('This would execute actual on-chain transactions:')
      console.log('  1. Close position transaction')
      console.log('  2. Create position transaction')
      console.log()
      console.log('Implementation needed:')
      console.log('  • Build close position instruction')
      console.log('  • Build create position instruction')
      console.log('  • Sign and send transactions')
      console.log('  • Wait for confirmations')
      console.log()
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
  console.log('  [1/2] Closing position...')
  await new Promise(resolve => setTimeout(resolve, 1500))
  console.log('        ✓ Position closed')
  console.log(`        ✓ Harvested $${position.pendingFeesUSD.toFixed(2)} in fees`)
  console.log(`        ✓ Withdrew ${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
  console.log(`        ✓ Withdrew ${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
  console.log()

  console.log('  [2/2] Creating new position...')
  await new Promise(resolve => setTimeout(resolve, 1500))
  console.log('        ✓ New position created')
  console.log(`        ✓ Range: $${newPriceMin.toFixed(4)} - $${newPriceMax.toFixed(4)}`)
  console.log(`        ✓ Deposited ${position.token0Amount.toFixed(4)} ${position.token0Symbol}`)
  console.log(`        ✓ Deposited ${position.token1Amount.toFixed(4)} ${position.token1Symbol}`)
  console.log()
}
