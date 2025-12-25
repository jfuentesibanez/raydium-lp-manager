import logger from '../utils/logger'

interface CloseOptions {
  position: string
}

export async function closeCommand(options: CloseOptions) {
  logger.info('Close Position')
  logger.info(`Position ID: ${options.position}`)

  logger.warn('⚠️  Close position not yet implemented')
  logger.info('This will remove all liquidity and close the position')
}
