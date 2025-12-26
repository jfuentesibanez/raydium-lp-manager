import dotenv from 'dotenv'

dotenv.config()

// Force redeploy - debugging wallet address validation

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  solana: {
    network: process.env.SOLANA_NETWORK || 'devnet',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },

  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    name: process.env.POSTGRES_DB || 'raydium_lp_manager',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  wallet: {
    publicKey: (process.env.WALLET_PUBLIC_KEY || '').trim(),
  },

  raydium: {
    clmmProgramId: process.env.RAYDIUM_CLMM_PROGRAM_ID || 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  },

  pyth: {
    programId: process.env.PYTH_PROGRAM_ID || 'gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s',
  },

  automation: {
    autoRebalanceEnabled: process.env.AUTO_REBALANCE_ENABLED === 'true',
    autoCompoundEnabled: process.env.AUTO_COMPOUND_ENABLED === 'true',
    positionCheckInterval: parseInt(process.env.POSITION_CHECK_INTERVAL_MS || '60000', 10),
    minHarvestThreshold: parseFloat(process.env.MIN_HARVEST_THRESHOLD_USD || '10'),
    maxGasCost: parseFloat(process.env.MAX_GAS_COST_USD || '5'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}

export default config
