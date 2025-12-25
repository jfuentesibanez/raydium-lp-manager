import { Connection, PublicKey } from '@solana/web3.js'
import logger from '../utils/logger'
import config from '../config'
import raydiumService from '../services/raydium-mock.service'

interface StatusOptions {
  wallet?: string
}

export async function statusCommand(options: StatusOptions) {
  const connection = new Connection(config.solana.rpcUrl, 'confirmed')

  // Use wallet from options or from env
  const walletAddress = options.wallet || config.wallet.publicKey

  if (!walletAddress) {
    logger.error('No wallet address provided. Use --wallet or set WALLET_PUBLIC_KEY in .env')
    process.exit(1)
  }

  logger.info(`Fetching positions for wallet: ${walletAddress}`)

  try {
    const positions = await raydiumService.getWalletPositions(walletAddress)

    if (positions.length === 0) {
      logger.info('No positions found')
      return
    }

    logger.info(`\nFound ${positions.length} position(s):\n`)

    let totalValue = 0
    let totalPendingFees = 0
    let inRangeCount = 0

    for (const position of positions) {
      const isInRange = !position.isOutOfRange
      if (isInRange) inRangeCount++

      totalValue += position.totalValueUSD
      totalPendingFees += position.pendingFeesUSD

      logger.info(`Position: ${position.poolName}`)
      logger.info(`  ID: ${position.id}`)
      logger.info(`  Status: ${isInRange ? '✓ In Range' : '⚠️  Out of Range'}`)
      logger.info(`  Value: $${position.totalValueUSD.toFixed(2)}`)
      logger.info(`  APR: ${position.apr.toFixed(2)}%`)
      logger.info(`  Price Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
      logger.info(`  Current Price: $${position.currentPrice.toFixed(4)}`)
      logger.info(`  Pending Fees: $${position.pendingFeesUSD.toFixed(2)}`)
      logger.info('')
    }

    logger.info('Portfolio Summary:')
    logger.info(`  Total Value: $${totalValue.toFixed(2)}`)
    logger.info(`  Total Pending Fees: $${totalPendingFees.toFixed(2)}`)
    logger.info(`  Positions In Range: ${inRangeCount}/${positions.length}`)
    logger.info(`  Positions Out of Range: ${positions.length - inRangeCount}/${positions.length}`)

  } catch (error) {
    logger.error('Failed to fetch positions:', error)
    throw error
  }
}
