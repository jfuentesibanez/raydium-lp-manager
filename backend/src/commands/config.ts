import logger from '../utils/logger'
import fs from 'fs'
import path from 'path'

interface ConfigOptions {
  init: boolean
  show: boolean
}

const defaultConfig = `# Raydium LP CLI Configuration

# Automation Settings
automation:
  check_interval: 5  # minutes
  auto_rebalance: true
  auto_compound: true
  rebalance_threshold: 5  # percent price movement
  compound_threshold: 10  # USD minimum to compound

# Position Defaults
defaults:
  price_range: 10  # percent ±
  slippage: 0.5  # percent

# Notifications
notifications:
  enabled: false
  # webhook_url: "https://discord.com/api/webhooks/..."
`

export async function configCommand(options: ConfigOptions) {
  const configPath = path.join(process.cwd(), 'raydium-lp.config.yml')

  if (options.init) {
    if (fs.existsSync(configPath)) {
      logger.warn('Config file already exists at raydium-lp.config.yml')
      return
    }

    fs.writeFileSync(configPath, defaultConfig)
    logger.info('✓ Created configuration file: raydium-lp.config.yml')
    logger.info('Edit this file to customize your automation settings')
    return
  }

  if (options.show) {
    if (!fs.existsSync(configPath)) {
      logger.warn('No config file found. Run: raydium-lp config --init')
      return
    }

    const config = fs.readFileSync(configPath, 'utf-8')
    logger.info('Current Configuration:\n')
    console.log(config)
    return
  }

  logger.info('Config command')
  logger.info('  --init  Create default config file')
  logger.info('  --show  Show current configuration')
}
