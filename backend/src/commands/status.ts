import logger from '../utils/logger'
import config from '../config'
import raydiumMockService from '../services/raydium-mock.service'
import raydiumRealService from '../services/raydium.service'

interface StatusOptions {
  wallet?: string
  real?: boolean
}

export async function statusCommand(options: StatusOptions) {

  // Use wallet from options or from env
  const walletAddress = options.wallet || config.wallet.publicKey

  if (!walletAddress) {
    console.error('\n❌ No wallet address provided. Use --wallet or set WALLET_PUBLIC_KEY in .env\n')
    process.exit(1)
  }

  // Choose service based on --real flag
  const raydiumService = options.real ? raydiumRealService : raydiumMockService
  const dataSource = options.real ? 'REAL on-chain data' : 'MOCK data'

  console.log('\n╔════════════════════════════════════════════════════════════════════════╗')
  console.log('║              RAYDIUM LP POSITION STATUS                                ║')
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n')
  console.log(`📍 Wallet: ${walletAddress.slice(0, 20)}...`)
  console.log(`📊 Source: ${dataSource}\n`)

  try {
    const positions = await raydiumService.getWalletPositions(walletAddress)

    if (positions.length === 0) {
      console.log('ℹ️  No positions found\n')
      return
    }

    let totalValue = 0
    let totalPendingFees = 0
    let inRangeCount = 0

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i]
      const isInRange = !position.isOutOfRange
      if (isInRange) inRangeCount++

      totalValue += position.totalValueUSD
      totalPendingFees += position.pendingFeesUSD

      console.log('─'.repeat(74))
      console.log(`\n${isInRange ? '✅' : '⚠️ '} ${position.poolName}`)
      console.log(`   ID: ${position.id}`)
      console.log(`   Status: ${isInRange ? '🟢 In Range' : '🔴 Out of Range'}`)
      console.log(`   Value: $${position.totalValueUSD.toFixed(2).padStart(10)} | APR: ${position.apr.toFixed(2)}%`)
      console.log(`   Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
      console.log(`   Price: $${position.currentPrice.toFixed(4)} ${isInRange ? '(in range)' : '(OUT OF RANGE)'}`)
      console.log(`   Fees:  $${position.pendingFeesUSD.toFixed(2)}`)
      console.log()
    }

    console.log('═'.repeat(74))
    console.log('\n📈 PORTFOLIO SUMMARY')
    console.log('─'.repeat(74))
    console.log(`   Total Value:       $${totalValue.toFixed(2)}`)
    console.log(`   Pending Fees:      $${totalPendingFees.toFixed(2)}`)
    console.log(`   In Range:          ${inRangeCount}/${positions.length} positions`)
    console.log(`   Out of Range:      ${positions.length - inRangeCount}/${positions.length} positions`)
    console.log('═'.repeat(74))
    console.log()

  } catch (error) {
    logger.error('Failed to fetch positions:', error)
    throw error
  }
}
