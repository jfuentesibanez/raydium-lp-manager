import { Connection, PublicKey } from '@solana/web3.js'
import { Raydium, ApiV3PoolInfoStandardItemCpmm, PositionInfoLayout, PoolFetchType } from '@raydium-io/raydium-sdk-v2'
import config from '../config'
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

export class RaydiumService {
  private connection: Connection
  private raydium: Raydium | null = null
  private programId: PublicKey

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed')
    this.programId = new PublicKey(config.raydium.clmmProgramId)
  }

  /**
   * Initialize Raydium SDK
   */
  private async initRaydium(): Promise<Raydium> {
    if (this.raydium) {
      return this.raydium
    }

    try {
      logger.info('Initializing Raydium SDK...')

      this.raydium = await Raydium.load({
        connection: this.connection,
        cluster: config.solana.network as 'mainnet' | 'devnet',
        owner: PublicKey.default, // We don't need owner for read operations
        disableFeatureCheck: true,
        disableLoadToken: false,
      })

      logger.info('Raydium SDK initialized successfully')
      return this.raydium
    } catch (error) {
      logger.error('Failed to initialize Raydium SDK:', error)
      throw error
    }
  }

  /**
   * Fetch pool information by pool address
   */
  async getPoolInfo(poolAddress: string): Promise<PoolData | null> {
    try {
      logger.info(`Fetching pool info for ${poolAddress}`)

      const raydium = await this.initRaydium()
      const poolPubkey = new PublicKey(poolAddress)

      // Fetch pool account info
      const accountInfo = await this.connection.getAccountInfo(poolPubkey)

      if (!accountInfo) {
        logger.warn(`Pool ${poolAddress} not found`)
        return null
      }

      // Try to fetch from API first (more efficient)
      try {
        const poolsData = await raydium.api.fetchPoolById({ ids: poolAddress })

        if (poolsData && poolsData.length > 0) {
          const pool = poolsData[0] as ApiV3PoolInfoStandardItemCpmm

          return {
            address: poolAddress,
            name: `${pool.mintA.symbol}/${pool.mintB.symbol}`,
            token0Mint: pool.mintA.address,
            token0Symbol: pool.mintA.symbol,
            token1Mint: pool.mintB.address,
            token1Symbol: pool.mintB.symbol,
            currentPrice: typeof pool.price === 'string' ? parseFloat(pool.price) : pool.price,
            liquidity: pool.tvl?.toString() || '0',
            volume24h: pool.day?.volume || 0,
            apr: pool.day?.apr || 0,
            tvl: pool.tvl || 0,
          }
        }
      } catch (apiError) {
        logger.warn('API fetch failed, falling back to on-chain data:', apiError)
      }

      // Fallback: parse on-chain data directly
      // Note: This requires understanding the pool account layout
      logger.info('Pool found on-chain, but API data not available')

      return {
        address: poolAddress,
        name: 'Unknown Pool',
        token0Mint: '',
        token0Symbol: '',
        token1Mint: '',
        token1Symbol: '',
        currentPrice: 0,
        liquidity: '0',
        volume24h: 0,
        apr: 0,
        tvl: 0,
      }

    } catch (error) {
      logger.error(`Error fetching pool info for ${poolAddress}:`, error)
      return null
    }
  }

  /**
   * Fetch all positions for a wallet address
   */
  async getWalletPositions(walletAddress: string): Promise<PositionData[]> {
    try {
      logger.info(`Fetching positions for wallet ${walletAddress}`)

      await this.initRaydium()
      const walletPubkey = new PublicKey(walletAddress)

      // Find all token accounts owned by the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { programId: new PublicKey('TokenkgQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )

      const positions: PositionData[] = []

      for (const { account } of tokenAccounts.value) {
        const tokenAmount = account.data.parsed.info.tokenAmount

        // Only process accounts with exactly 1 token (NFTs)
        if (tokenAmount.uiAmount === 1 && tokenAmount.decimals === 0) {
          const nftMint = new PublicKey(account.data.parsed.info.mint)

          try {
            // Derive the position PDA from the NFT mint
            const [positionPDA] = PublicKey.findProgramAddressSync(
              [Buffer.from('position'), nftMint.toBuffer()],
              this.programId
            )

            // Fetch position account
            const positionAccount = await this.connection.getAccountInfo(positionPDA)

            if (positionAccount && positionAccount.data) {
              try {
                // Deserialize position data
                const positionData = PositionInfoLayout.decode(positionAccount.data)

                // Fetch pool info
                const poolAddress = positionData.poolId.toString()
                const poolInfo = await this.getPoolInfo(poolAddress)

                if (!poolInfo) {
                  logger.warn(`Pool ${poolAddress} not found for position`)
                  continue
                }

                // Calculate token amounts and position value
                const details = this.calculatePositionValue(
                  positionData,
                  poolInfo
                )

                positions.push({
                  id: positionPDA.toString(),
                  nftMint: nftMint.toString(),
                  poolAddress,
                  poolName: poolInfo.name,
                  token0Mint: poolInfo.token0Mint,
                  token0Symbol: poolInfo.token0Symbol,
                  token1Mint: poolInfo.token1Mint,
                  token1Symbol: poolInfo.token1Symbol,
                  ...details,
                })
              } catch (decodeError) {
                logger.warn(`Failed to decode position ${positionPDA.toString()}:`, decodeError)
              }
            }
          } catch (pdaError) {
            logger.warn(`Failed to process NFT ${nftMint.toString()}:`, pdaError)
          }
        }
      }

      logger.info(`Found ${positions.length} position(s) for wallet ${walletAddress}`)
      return positions

    } catch (error) {
      logger.error(`Error fetching positions for wallet ${walletAddress}:`, error)
      throw error
    }
  }

  /**
   * Fetch popular/high liquidity pools
   */
  async getPopularPools(): Promise<PoolData[]> {
    try {
      logger.info('Fetching popular pools...')

      const raydium = await this.initRaydium()

      // Fetch pools from Raydium API
      const poolsData = await raydium.api.getPoolList({
        type: PoolFetchType.Concentrated,
        sort: 'liquidity',
        order: 'desc',
        pageSize: 20,
      })

      const pools: PoolData[] = []

      for (const pool of poolsData.data) {
        if ('mintA' in pool && 'mintB' in pool) {
          const clmmPool = pool as ApiV3PoolInfoStandardItemCpmm

          pools.push({
            address: clmmPool.id,
            name: `${clmmPool.mintA.symbol}/${clmmPool.mintB.symbol}`,
            token0Mint: clmmPool.mintA.address,
            token0Symbol: clmmPool.mintA.symbol,
            token1Mint: clmmPool.mintB.address,
            token1Symbol: clmmPool.mintB.symbol,
            currentPrice: typeof clmmPool.price === 'string' ? parseFloat(clmmPool.price) : clmmPool.price,
            liquidity: clmmPool.tvl?.toString() || '0',
            volume24h: clmmPool.day?.volume || 0,
            apr: clmmPool.day?.apr || 0,
            tvl: clmmPool.tvl || 0,
          })
        }
      }

      logger.info(`Found ${pools.length} popular pools`)
      return pools

    } catch (error) {
      logger.error('Error fetching popular pools:', error)
      throw error
    }
  }

  /**
   * Calculate position value and details
   */
  private calculatePositionValue(
    position: any,
    poolInfo: PoolData
  ): {
    token0Amount: number
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
  } {
    try {
      const tickLower = position.tickLowerIndex
      const tickUpper = position.tickUpperIndex
      const liquidity = position.liquidity.toString()

      // Calculate price range
      const priceMin = this.tickToPrice(tickLower)
      const priceMax = this.tickToPrice(tickUpper)

      // Determine if position is in range
      // We'll use current price from pool data
      const currentPrice = poolInfo.currentPrice
      const isOutOfRange = currentPrice < priceMin || currentPrice > priceMax

      // Calculate token amounts (simplified)
      // In production, you'd use more precise calculations based on liquidity
      const token0Amount = parseFloat(position.tokenFeesOwed0 || '0') / 1e6 // Adjust for decimals
      const token1Amount = parseFloat(position.tokenFeesOwed1 || '0') / 1e6

      // Calculate total value (simplified - would need actual token prices)
      const totalValueUSD = (token0Amount * currentPrice) + token1Amount

      // Pending fees
      const pendingFeesUSD = 0 // Would need to calculate from fee growth

      return {
        token0Amount,
        token1Amount,
        tickLower,
        tickUpper,
        priceMin,
        priceMax,
        currentPrice,
        liquidity,
        totalValueUSD,
        pendingFeesUSD,
        apr: poolInfo.apr,
        isOutOfRange,
      }
    } catch (error) {
      logger.error('Error calculating position value:', error)
      throw error
    }
  }

  /**
   * Convert tick to price
   */
  private tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick)
  }
}

export default new RaydiumService()
