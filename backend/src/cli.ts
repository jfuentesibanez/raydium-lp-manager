#!/usr/bin/env node

import { Command } from 'commander'
import dotenv from 'dotenv'
import logger from './utils/logger'

// Load environment variables
dotenv.config()

const program = new Command()

program
  .name('raydium-lp')
  .description('Automated CLI tool for managing Raydium Liquidity Positions')
  .version('0.1.0')

// Status command - view all positions
program
  .command('status')
  .description('Show status of all liquidity positions')
  .option('-w, --wallet <address>', 'Wallet address to check')
  .option('--real', 'Use real on-chain data instead of mock data')
  .action(async (options) => {
    try {
      logger.info('Fetching position status...')
      const { statusCommand } = await import('./commands/status')
      await statusCommand(options)
    } catch (error) {
      logger.error('Error fetching status:', error)
      process.exit(1)
    }
  })

// Monitor command - continuous monitoring with auto-rebalance
program
  .command('monitor')
  .description('Monitor positions and auto-rebalance when needed')
  .option('-i, --interval <minutes>', 'Check interval in minutes', '5')
  .option('--no-rebalance', 'Disable automatic rebalancing')
  .option('--no-compound', 'Disable automatic fee compounding')
  .action(async (options) => {
    try {
      logger.info('Starting position monitor...')
      const { monitorCommand } = await import('./commands/monitor')
      await monitorCommand(options)
    } catch (error) {
      logger.error('Error in monitor:', error)
      process.exit(1)
    }
  })

// Create command - create new position
program
  .command('create')
  .description('Create a new liquidity position')
  .requiredOption('-p, --pool <address>', 'Pool address')
  .requiredOption('-a, --amount <number>', 'Amount of first token')
  .option('-r, --range <percent>', 'Price range percentage (e.g., 10 for ±10%)', '10')
  .option('--min-price <number>', 'Minimum price (overrides range)')
  .option('--max-price <number>', 'Maximum price (overrides range)')
  .action(async (options) => {
    try {
      logger.info('Creating new position...')
      const { createCommand } = await import('./commands/create')
      await createCommand(options)
    } catch (error) {
      logger.error('Error creating position:', error)
      process.exit(1)
    }
  })

// Harvest command - harvest fees
program
  .command('harvest')
  .description('Harvest fees from positions')
  .option('-p, --position <id>', 'Specific position ID')
  .option('--all', 'Harvest all positions')
  .option('--compound', 'Reinvest harvested fees')
  .action(async (options) => {
    try {
      logger.info('Harvesting fees...')
      const { harvestCommand } = await import('./commands/harvest')
      await harvestCommand(options)
    } catch (error) {
      logger.error('Error harvesting:', error)
      process.exit(1)
    }
  })

// Rebalance command - rebalance position
program
  .command('rebalance')
  .description('Rebalance an out-of-range position')
  .requiredOption('-p, --position <id>', 'Position ID to rebalance')
  .option('-r, --range <percent>', 'New price range percentage', '10')
  .option('--real', 'Use real on-chain data instead of mock data')
  .option('--force', 'Force rebalance even if not recommended')
  .action(async (options) => {
    try {
      logger.info('Rebalancing position...')
      const { rebalanceCommand } = await import('./commands/rebalance')
      await rebalanceCommand(options)
    } catch (error) {
      logger.error('Error rebalancing:', error)
      process.exit(1)
    }
  })

// Close command - close position
program
  .command('close')
  .description('Close a liquidity position')
  .requiredOption('-p, --position <id>', 'Position ID to close')
  .action(async (options) => {
    try {
      logger.info('Closing position...')
      const { closeCommand } = await import('./commands/close')
      await closeCommand(options)
    } catch (error) {
      logger.error('Error closing position:', error)
      process.exit(1)
    }
  })

// Config command - manage configuration
program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Initialize configuration file')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    try {
      const { configCommand } = await import('./commands/config')
      await configCommand(options)
    } catch (error) {
      logger.error('Error with config:', error)
      process.exit(1)
    }
  })

program.parse()
