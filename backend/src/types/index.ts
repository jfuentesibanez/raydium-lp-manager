export interface Position {
  id: string
  walletAddress: string
  poolAddress: string
  poolName: string
  token0Mint: string
  token0Symbol: string
  token0Amount: number
  token1Mint: string
  token1Symbol: string
  token1Amount: number
  currentPrice: number
  priceRangeMin: number
  priceRangeMax: number
  totalValueUSD: number
  apr: number
  pendingYieldUSD: number
  isOutOfRange: boolean
  createdAt: Date
  updatedAt: Date
  lastRebalancedAt?: Date
}

export interface PoolData {
  address: string
  name: string
  token0Symbol: string
  token1Symbol: string
  token0Mint: string
  token1Mint: string
  currentPrice: number
  liquidity: string
  volume24h: number
  apr: number
}

export interface PriceData {
  symbol: string
  price: number
  timestamp: number
}

export interface AutomationConfig {
  positionId: string
  enabled: boolean
  strategy: 'narrow' | 'medium' | 'wide' | 'custom'
  autoRebalance: boolean
  autoCompound: boolean
  minYieldThreshold: number
  rebalanceTrigger: string
  customRangePercent?: number
}

export interface RebalanceLog {
  id: string
  positionId: string
  oldPriceRangeMin: number
  oldPriceRangeMax: number
  newPriceRangeMin: number
  newPriceRangeMax: number
  gasCost: number
  timestamp: Date
  success: boolean
  errorMessage?: string
}
