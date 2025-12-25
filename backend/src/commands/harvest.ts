import logger from '../utils/logger'

interface HarvestOptions {
  position?: string
  all: boolean
  compound: boolean
}

export async function harvestCommand(options: HarvestOptions) {
  logger.info('Harvest Fees')

  if (options.all) {
    logger.info('Harvesting fees from all positions')
  } else if (options.position) {
    logger.info(`Harvesting fees from position: ${options.position}`)
  } else {
    logger.error('Please specify --position or --all')
    process.exit(1)
  }

  if (options.compound) {
    logger.info('Compound mode: Will reinvest harvested fees')
  }

  logger.warn('⚠️  Harvest not yet implemented')
}
