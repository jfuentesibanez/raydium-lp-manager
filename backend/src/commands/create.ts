import logger from '../utils/logger'

interface CreateOptions {
  pool: string
  amount: string
  range: string
  minPrice?: string
  maxPrice?: string
}

export async function createCommand(options: CreateOptions) {
  logger.info('Create Position')
  logger.info(`Pool: ${options.pool}`)
  logger.info(`Amount: ${options.amount}`)
  logger.info(`Range: ±${options.range}%`)

  logger.warn('⚠️  Position creation not yet implemented')
  logger.info('This will create a new liquidity position on Raydium')
}
