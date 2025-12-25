import { Connection, PublicKey } from '@solana/web3.js'
import config from '../config'
import logger from '../utils/logger'
import Decimal from 'decimal.js'

// Raydium CLMM Pool State structure
interface PoolState {
  ammConfig: PublicKey
  poolCreator: PublicKey
  tokenMint0: PublicKey
  tokenMint1: PublicKey
  tokenVault0: PublicKey
  tokenVault1: PublicKey
  observationKey: PublicKey
  tickArrayBitmap: PublicKey
  liquidity: string
  sqrtPriceX64: string
  tickCurrent: number
  feeGrowthGlobal0X64: string
  feeGrowthGlobal1X64: string
  protocolFeesToken0: string
  protocolFeesToken1: string
  swapInAmountToken0: string
  swapOutAmountToken1: string
  swapInAmountToken1: string
  swapOutAmountToken0: string
  status: number
}

// Position state structure
interface PositionState {
  poolId: PublicKey
  nftMint: PublicKey
  tickLowerIndex: number
  tickUpperIndex: number
  liquidity: string
  feeGrowthInside0LastX64: string
  feeGrowthInside1LastX64: string
  tokenFeesOwed0: string
  tokenFeesOwed1: string
  rewardInfos: any[]
}

export class RaydiumService {
  private connection: Connection
  private programId: PublicKey

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed')
    this.programId = new PublicKey(config.raydium.clmmProgramId)
  }

  /**
   * Fetch pool information by pool address
   */
  async getPoolInfo(poolAddress: string): Promise<any> {
    try {
      const poolPubkey = new PublicKey(poolAddress)
      const accountInfo = await this.connection.getAccountInfo(poolPubkey)

      if (!accountInfo) {
        throw new Error('Pool not found')
      }

      // Deserialize pool state
      // Note: This is a simplified version. In production, you'd use the Raydium SDK
      // to properly deserialize the account data
      const poolData = this.deserializePoolState(accountInfo.data)

      // Calculate current price from sqrtPriceX64
      const price = this.sqrtPriceX64ToPrice(poolData.sqrtPriceX64)

      return {
        address: poolAddress,
        token0Mint: poolData.tokenMint0.toString(),
        token1Mint: poolData.tokenMint1.toString(),
        liquidity: poolData.liquidity,
        currentPrice: price,
        tickCurrent: poolData.tickCurrent,
        feeGrowthGlobal0: poolData.feeGrowthGlobal0X64,
        feeGrowthGlobal1: poolData.feeGrowthGlobal1X64,
      }
    } catch (error) {
      logger.error(`Error fetching pool info for ${poolAddress}:`, error)
      throw error
    }
  }

  /**
   * Fetch all positions for a wallet address
   */
  async getWalletPositions(walletAddress: string): Promise<any[]> {
    try {
      const walletPubkey = new PublicKey(walletAddress)

      // Find all token accounts owned by the wallet that are position NFTs
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { programId: new PublicKey('TokenkgQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )

      const positions: any[] = []

      for (const { account } of tokenAccounts.value) {
        const tokenAmount = account.data.parsed.info.tokenAmount

        // Only process accounts with exactly 1 token (NFTs)
        if (tokenAmount.uiAmount === 1) {
          const mint = new PublicKey(account.data.parsed.info.mint)

          // Derive the position PDA from the NFT mint
          const [positionPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('position'), mint.toBuffer()],
            this.programId
          )

          // Fetch position account
          const positionAccount = await this.connection.getAccountInfo(positionPDA)

          if (positionAccount) {
            const positionData = this.deserializePositionState(positionAccount.data)

            // Fetch pool data for this position
            const poolInfo = await this.getPoolInfo(positionData.poolId.toString())

            // Calculate position value and pending fees
            const positionDetails = await this.calculatePositionDetails(
              positionData,
              poolInfo
            )

            positions.push({
              id: positionPDA.toString(),
              nftMint: mint.toString(),
              poolAddress: positionData.poolId.toString(),
              ...positionDetails,
            })
          }
        }
      }

      return positions
    } catch (error) {
      logger.error(`Error fetching positions for wallet ${walletAddress}:`, error)
      throw error
    }
  }

  /**
   * Fetch popular/high liquidity pools
   */
  async getPopularPools(): Promise<any[]> {
    try {
      // In production, you would:
      // 1. Query Raydium API or maintain a curated list
      // 2. Use getProgramAccounts to find all pools
      // 3. Sort by TVL or volume

      // For now, returning well-known pool addresses
      const popularPoolAddresses: string[] = [
        // These would be actual Raydium CLMM pool addresses
        // You'll need to add real addresses from Raydium
      ]

      const pools = []
      for (const address of popularPoolAddresses) {
        try {
          const poolInfo = await this.getPoolInfo(address)
          pools.push(poolInfo)
        } catch (error) {
          logger.warn(`Failed to fetch pool ${address}:`, error)
        }
      }

      return pools
    } catch (error) {
      logger.error('Error fetching popular pools:', error)
      throw error
    }
  }

  /**
   * Calculate position details including value and pending fees
   */
  private async calculatePositionDetails(
    position: PositionState,
    poolInfo: any
  ): Promise<any> {
    try {
      // Calculate token amounts from liquidity and tick range
      const { amount0, amount1 } = this.getTokenAmountsFromLiquidity(
        position.liquidity,
        position.tickLowerIndex,
        position.tickUpperIndex,
        poolInfo.tickCurrent,
        poolInfo.currentPrice
      )

      // Check if position is in range
      const isInRange = poolInfo.tickCurrent >= position.tickLowerIndex
        && poolInfo.tickCurrent <= position.tickUpperIndex

      // Calculate price range from ticks
      const priceMin = this.tickToPrice(position.tickLowerIndex)
      const priceMax = this.tickToPrice(position.tickUpperIndex)

      return {
        tickLower: position.tickLowerIndex,
        tickUpper: position.tickUpperIndex,
        liquidity: position.liquidity,
        token0Amount: amount0,
        token1Amount: amount1,
        priceMin,
        priceMax,
        currentPrice: poolInfo.currentPrice,
        isOutOfRange: !isInRange,
        pendingFees0: position.tokenFeesOwed0,
        pendingFees1: position.tokenFeesOwed1,
      }
    } catch (error) {
      logger.error('Error calculating position details:', error)
      throw error
    }
  }

  /**
   * Convert sqrtPriceX64 to human-readable price
   */
  private sqrtPriceX64ToPrice(sqrtPriceX64: string): number {
    const Q64 = new Decimal(2).pow(64)
    const sqrtPrice = new Decimal(sqrtPriceX64).div(Q64)
    const price = sqrtPrice.pow(2)
    return price.toNumber()
  }

  /**
   * Convert tick to price
   */
  private tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick)
  }

  /**
   * Calculate token amounts from liquidity
   */
  private getTokenAmountsFromLiquidity(
    liquidity: string,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number,
    currentPrice: number
  ): { amount0: number; amount1: number } {
    const L = new Decimal(liquidity)
    const priceLower = this.tickToPrice(tickLower)
    const priceUpper = this.tickToPrice(tickUpper)

    let amount0 = 0
    let amount1 = 0

    if (tickCurrent < tickLower) {
      // Position is entirely in token0
      const sqrtPriceLower = Math.sqrt(priceLower)
      const sqrtPriceUpper = Math.sqrt(priceUpper)
      amount0 = L.mul(sqrtPriceUpper - sqrtPriceLower).div(sqrtPriceUpper * sqrtPriceLower).toNumber()
    } else if (tickCurrent >= tickUpper) {
      // Position is entirely in token1
      const sqrtPriceLower = Math.sqrt(priceLower)
      const sqrtPriceUpper = Math.sqrt(priceUpper)
      amount1 = L.mul(sqrtPriceUpper - sqrtPriceLower).toNumber()
    } else {
      // Position is in range, split between both tokens
      const sqrtPriceCurrent = Math.sqrt(currentPrice)
      const sqrtPriceLower = Math.sqrt(priceLower)
      const sqrtPriceUpper = Math.sqrt(priceUpper)

      amount0 = L.mul(sqrtPriceUpper - sqrtPriceCurrent).div(sqrtPriceUpper * sqrtPriceCurrent).toNumber()
      amount1 = L.mul(sqrtPriceCurrent - sqrtPriceLower).toNumber()
    }

    return { amount0, amount1 }
  }

  /**
   * Deserialize pool state from account data
   * Note: This is simplified. Use Raydium SDK's actual deserializer in production
   */
  private deserializePoolState(_data: Buffer): PoolState {
    // This is a placeholder. In production, you would:
    // 1. Use the actual Raydium CLMM IDL
    // 2. Use Anchor to deserialize the account data
    // 3. Or use Raydium's official SDK if available

    // For now, throw error to remind us this needs proper implementation
    throw new Error('Pool deserialization needs Raydium SDK implementation')
  }

  /**
   * Deserialize position state from account data
   */
  private deserializePositionState(_data: Buffer): PositionState {
    // Same as above - needs proper implementation with Raydium SDK
    throw new Error('Position deserialization needs Raydium SDK implementation')
  }

  /**
   * Get token metadata (symbol, decimals)
   */
  async getTokenMetadata(mintAddress: string): Promise<{ symbol: string; decimals: number }> {
    try {
      const mint = new PublicKey(mintAddress)
      const mintInfo = await this.connection.getParsedAccountInfo(mint)

      if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
        throw new Error('Invalid mint account')
      }

      const decimals = mintInfo.value.data.parsed.info.decimals

      // For symbol, you'd typically fetch from a token list or metadata
      // For now, return a placeholder
      const symbol = await this.getTokenSymbol(mintAddress)

      return { symbol, decimals }
    } catch (error) {
      logger.error(`Error fetching token metadata for ${mintAddress}:`, error)
      throw error
    }
  }

  /**
   * Get token symbol from common token list
   */
  private async getTokenSymbol(mintAddress: string): Promise<string> {
    // Map of known token mints to symbols
    const knownTokens: Record<string, string> = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
    }

    return knownTokens[mintAddress] || 'UNKNOWN'
  }
}

export default new RaydiumService()
