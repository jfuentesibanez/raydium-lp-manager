/**
 * Mock Raydium Service
 *
 * This is a temporary implementation that returns mock data.
 * It's structured identically to the real service so switching is seamless.
 *
 * TODO: Replace with real Raydium SDK integration when ready
 */

import logger from '../utils/logger'

interface PoolData {
  address: string
  name: string
  token0Mint: string
  token0Symbol: string
  token1Mint: string
  token1Symbol: string
  currentPrice: number
  liquidity: string
  volume24h: number
  apr: number
  tvl: number
}

interface PositionData {
  id: string
  nftMint: string
  poolAddress: string
  poolName: string
  token0Mint: string
  token0Symbol: string
  token0Amount: number
  token1Mint: string
  token1Symbol: string
  token1Amount: number
  tickLower: number
  tickUpper: number
  priceMin: number
  priceMax: number
  currentPrice: number
  liquidity: string
  totalValueUSD: number
  pendingFeesUSD: number
  apr: number
  isOutOfRange: boolean
}

export class RaydiumMockService {
  private mockPools: PoolData[] = [
    {
      address: '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht',
      name: 'SOL/USDC',
      token0Mint: 'So11111111111111111111111111111111111111112',
      token0Symbol: 'SOL',
      token1Mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      token1Symbol: 'USDC',
      currentPrice: 100.50,
      liquidity: '5000000',
      volume24h: 2500000,
      apr: 28.5,
      tvl: 10000000,
    },
    {
      address: 'AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA',
      name: 'SOL/USDT',
      token0Mint: 'So11111111111111111111111111111111111111112',
      token0Symbol: 'SOL',
      token1Mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      token1Symbol: 'USDT',
      currentPrice: 100.25,
      liquidity: '3000000',
      volume24h: 1800000,
      apr: 22.3,
      tvl: 6500000,
    },
    {
      address: '7gZNLDbWE73ueAoHuAeFoSu7JqmorwCLpNTBXHtYSFTa',
      name: 'RAY/SOL',
      token0Mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      token0Symbol: 'RAY',
      token1Mint: 'So11111111111111111111111111111111111111112',
      token1Symbol: 'SOL',
      currentPrice: 0.025,
      liquidity: '1500000',
      volume24h: 850000,
      apr: 35.8,
      tvl: 3200000,
    },
    {
      address: '5bj1Wh5pvZiX8LkwDCNKXWQGyMASLfDzePCpHVMJWEZo',
      name: 'mSOL/SOL',
      token0Mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      token0Symbol: 'mSOL',
      token1Mint: 'So11111111111111111111111111111111111111112',
      token1Symbol: 'SOL',
      currentPrice: 1.05,
      liquidity: '2000000',
      volume24h: 500000,
      apr: 12.5,
      tvl: 4500000,
    },
  ]

  async getPoolInfo(poolAddress: string): Promise<PoolData | null> {
    try {
      logger.info(`[MOCK] Fetching pool info for ${poolAddress}`)
      const pool = this.mockPools.find(p => p.address === poolAddress)
      return pool || null
    } catch (error) {
      logger.error(`Error fetching mock pool info:`, error)
      throw error
    }
  }

  async getPopularPools(): Promise<PoolData[]> {
    try {
      logger.info('[MOCK] Fetching popular pools')
      return this.mockPools
    } catch (error) {
      logger.error('Error fetching mock popular pools:', error)
      throw error
    }
  }

  async getWalletPositions(walletAddress: string): Promise<PositionData[]> {
    try {
      logger.info(`[MOCK] Fetching positions for wallet ${walletAddress}`)

      // Return mock positions
      // In real implementation, this would query on-chain data
      const mockPositions: PositionData[] = [
        {
          id: 'position_' + walletAddress.slice(0, 8) + '_1',
          nftMint: 'NFT' + walletAddress.slice(0, 8) + '1',
          poolAddress: this.mockPools[0].address,
          poolName: this.mockPools[0].name,
          token0Mint: this.mockPools[0].token0Mint,
          token0Symbol: this.mockPools[0].token0Symbol,
          token0Amount: 10.5,
          token1Mint: this.mockPools[0].token1Mint,
          token1Symbol: this.mockPools[0].token1Symbol,
          token1Amount: 1050,
          tickLower: -20000,
          tickUpper: 20000,
          priceMin: 95.0,
          priceMax: 105.0,
          currentPrice: this.mockPools[0].currentPrice,
          liquidity: '150000',
          totalValueUSD: 2100,
          pendingFeesUSD: 12.50,
          apr: this.mockPools[0].apr,
          isOutOfRange: false,
        },
        {
          id: 'position_' + walletAddress.slice(0, 8) + '_2',
          nftMint: 'NFT' + walletAddress.slice(0, 8) + '2',
          poolAddress: this.mockPools[2].address,
          poolName: this.mockPools[2].name,
          token0Mint: this.mockPools[2].token0Mint,
          token0Symbol: this.mockPools[2].token0Symbol,
          token0Amount: 5000,
          token1Mint: this.mockPools[2].token1Mint,
          token1Symbol: this.mockPools[2].token1Symbol,
          token1Amount: 1.25,
          tickLower: -30000,
          tickUpper: 10000,
          priceMin: 0.020,
          priceMax: 0.030,
          currentPrice: this.mockPools[2].currentPrice,
          liquidity: '80000',
          totalValueUSD: 850,
          pendingFeesUSD: 5.75,
          apr: this.mockPools[2].apr,
          isOutOfRange: true, // Out of range position
        },
      ]

      return mockPositions
    } catch (error) {
      logger.error('Error fetching mock wallet positions:', error)
      throw error
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<{ symbol: string; decimals: number }> {
    const knownTokens: Record<string, { symbol: string; decimals: number }> = {
      'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', decimals: 6 },
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
    }

    return knownTokens[mintAddress] || { symbol: 'UNKNOWN', decimals: 9 }
  }
}

export default new RaydiumMockService()
