import logger from '../utils/logger'

export interface RebalanceConfig {
  // Percentage threshold for rebalancing (e.g., 5 = 5% price movement)
  priceMovementThreshold: number
  // Default range width for new positions (e.g., 10 = ±10%)
  defaultRangePercent: number
  // Minimum time between rebalances (milliseconds)
  minRebalanceInterval: number
  // Maximum gas cost to approve rebalance (USD)
  maxGasCostUSD: number
  // Minimum position value to rebalance (USD)
  minPositionValueUSD: number
}

export interface PositionInfo {
  id: string
  poolName: string
  currentPrice: number
  priceMin: number
  priceMax: number
  totalValueUSD: number
  isOutOfRange: boolean
  liquidity: string
  token0Amount: number
  token1Amount: number
  pendingFeesUSD: number
}

export interface RebalanceDecision {
  shouldRebalance: boolean
  reason: string
  newPriceMin?: number
  newPriceMax?: number
  estimatedGasCost?: number
  recommendedAction?: 'rebalance' | 'close' | 'wait'
}

export class RebalanceStrategy {
  private config: RebalanceConfig
  private lastRebalanceTimes: Map<string, number> = new Map()

  constructor(config: RebalanceConfig) {
    this.config = config
  }

  /**
   * Decide if a position should be rebalanced
   */
  shouldRebalance(position: PositionInfo): RebalanceDecision {
    // Always calculate new range and gas cost first (needed for --force and info display)
    const { newPriceMin, newPriceMax } = this.calculateNewRange(position)
    const estimatedGasCost = this.estimateGasCost()

    // 1. Check if position value is above minimum
    if (position.totalValueUSD < this.config.minPositionValueUSD) {
      return {
        shouldRebalance: false,
        reason: `Position value ($${position.totalValueUSD.toFixed(2)}) below minimum ($${this.config.minPositionValueUSD})`,
        newPriceMin,
        newPriceMax,
        estimatedGasCost,
        recommendedAction: 'wait',
      }
    }

    // 2. Check if position is actually out of range
    if (!position.isOutOfRange) {
      return {
        shouldRebalance: false,
        reason: 'Position is still in range',
        newPriceMin,
        newPriceMax,
        estimatedGasCost,
        recommendedAction: 'wait',
      }
    }

    // 3. Check minimum time interval since last rebalance
    const lastRebalance = this.lastRebalanceTimes.get(position.id)
    if (lastRebalance) {
      const timeSinceRebalance = Date.now() - lastRebalance
      if (timeSinceRebalance < this.config.minRebalanceInterval) {
        const minutesRemaining = Math.ceil(
          (this.config.minRebalanceInterval - timeSinceRebalance) / 60000
        )
        return {
          shouldRebalance: false,
          reason: `Too soon since last rebalance (${minutesRemaining} min remaining)`,
          newPriceMin,
          newPriceMax,
          estimatedGasCost,
          recommendedAction: 'wait',
        }
      }
    }

    // 5. Calculate price movement from range
    const priceMovement = this.calculatePriceMovement(position)

    // 6. Check if movement exceeds threshold
    if (priceMovement < this.config.priceMovementThreshold) {
      return {
        shouldRebalance: false,
        reason: `Price movement (${priceMovement.toFixed(2)}%) below threshold (${this.config.priceMovementThreshold}%)`,
        newPriceMin,
        newPriceMax,
        estimatedGasCost,
        recommendedAction: 'wait',
      }
    }

    // 8. Check if gas cost is acceptable
    if (estimatedGasCost > this.config.maxGasCostUSD) {
      return {
        shouldRebalance: false,
        reason: `Estimated gas cost ($${estimatedGasCost.toFixed(2)}) exceeds maximum ($${this.config.maxGasCostUSD})`,
        newPriceMin,
        newPriceMax,
        estimatedGasCost,
        recommendedAction: 'wait',
      }
    }

    // 9. Calculate if rebalancing is profitable
    const isWorthRebalancing = this.isRebalanceProfitable(
      position,
      estimatedGasCost
    )

    if (!isWorthRebalancing) {
      return {
        shouldRebalance: false,
        reason: 'Rebalancing costs exceed potential benefits',
        newPriceMin,
        newPriceMax,
        estimatedGasCost,
        recommendedAction: 'wait',
      }
    }

    // All checks passed - recommend rebalance
    return {
      shouldRebalance: true,
      reason: `Position out of range by ${priceMovement.toFixed(2)}%, rebalancing recommended`,
      newPriceMin,
      newPriceMax,
      estimatedGasCost,
      recommendedAction: 'rebalance',
    }
  }

  /**
   * Calculate how far price has moved from the position range
   */
  private calculatePriceMovement(position: PositionInfo): number {
    const { currentPrice, priceMin, priceMax } = position
    const rangeCenter = (priceMin + priceMax) / 2

    if (currentPrice > priceMax) {
      // Price moved above range
      const movement = ((currentPrice - priceMax) / rangeCenter) * 100
      return movement
    } else if (currentPrice < priceMin) {
      // Price moved below range
      const movement = ((priceMin - currentPrice) / rangeCenter) * 100
      return movement
    }

    // Still in range
    return 0
  }

  /**
   * Calculate new optimal price range centered around current price
   */
  calculateNewRange(position: PositionInfo): {
    newPriceMin: number
    newPriceMax: number
  } {
    const currentPrice = position.currentPrice
    const rangePercent = this.config.defaultRangePercent / 100

    const newPriceMin = currentPrice * (1 - rangePercent)
    const newPriceMax = currentPrice * (1 + rangePercent)

    logger.info(`Calculated new range for ${position.poolName}:`)
    logger.info(`  Current Price: $${currentPrice.toFixed(4)}`)
    logger.info(`  Old Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}`)
    logger.info(`  New Range: $${newPriceMin.toFixed(4)} - $${newPriceMax.toFixed(4)} (±${this.config.defaultRangePercent}%)`)

    return { newPriceMin, newPriceMax }
  }

  /**
   * Estimate gas cost for rebalancing (close + create)
   */
  private estimateGasCost(): number {
    // Rough estimates based on Solana transaction fees
    // Close position: ~0.00001 SOL
    // Create position: ~0.00002 SOL
    // Total: ~0.00003 SOL

    // Assuming SOL price ~$100 (should be fetched in real implementation)
    const solPrice = 100
    const estimatedSolCost = 0.00003

    return estimatedSolCost * solPrice
  }

  /**
   * Check if rebalancing is profitable after gas costs
   */
  private isRebalanceProfitable(
    position: PositionInfo,
    gasCost: number
  ): boolean {
    // If pending fees cover gas cost, rebalancing is worth it
    if (position.pendingFeesUSD >= gasCost) {
      return true
    }

    // For larger positions, accept higher gas costs
    // Rule of thumb: gas should be < 1% of position value
    const gasPercentage = (gasCost / position.totalValueUSD) * 100

    if (gasPercentage < 1) {
      logger.info(`Gas cost (${gasPercentage.toFixed(3)}%) acceptable for position value ($${position.totalValueUSD.toFixed(2)})`)
      return true
    }

    logger.warn(`Gas cost (${gasPercentage.toFixed(3)}%) too high for position value ($${position.totalValueUSD.toFixed(2)})`)
    return false
  }

  /**
   * Record that a position was rebalanced
   */
  recordRebalance(positionId: string): void {
    this.lastRebalanceTimes.set(positionId, Date.now())
    logger.info(`Recorded rebalance for position ${positionId}`)
  }

  /**
   * Get recommended action for a position
   */
  getRecommendedAction(position: PositionInfo): string {
    const decision = this.shouldRebalance(position)

    if (decision.shouldRebalance) {
      return `🔄 REBALANCE: ${decision.reason}`
    } else if (decision.recommendedAction === 'close') {
      return `🗑️  CLOSE: ${decision.reason}`
    } else {
      return `⏸️  WAIT: ${decision.reason}`
    }
  }
}

/**
 * Create default rebalance strategy from config
 */
export function createRebalanceStrategy(config?: Partial<RebalanceConfig>): RebalanceStrategy {
  const defaultConfig: RebalanceConfig = {
    priceMovementThreshold: 5, // 5% price movement triggers rebalance
    defaultRangePercent: 10, // ±10% range for new positions
    minRebalanceInterval: 60 * 60 * 1000, // 1 hour
    maxGasCostUSD: 5, // Max $5 gas cost
    minPositionValueUSD: 100, // Min $100 position value
    ...config,
  }

  return new RebalanceStrategy(defaultConfig)
}
