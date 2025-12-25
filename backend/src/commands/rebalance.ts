import logger from '../utils/logger'

interface RebalanceOptions {
  position: string
  range: string
}

export async function rebalanceCommand(options: RebalanceOptions) {
  logger.info('Rebalance Position')
  logger.info(`Position ID: ${options.position}`)
  logger.info(`New Range: ±${options.range}%`)

  logger.warn('⚠️  Rebalance not yet implemented')
  logger.info('This will close the current position and create a new one with updated range')
}
