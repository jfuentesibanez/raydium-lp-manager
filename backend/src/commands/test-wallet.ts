import { PublicKey } from '@solana/web3.js'
import config from '../config'

export async function testWalletCommand() {
  console.log('\n🔍 Testing Wallet Configuration...\n')

  const walletAddress = config.wallet.publicKey

  console.log('Environment Variable Value:')
  console.log(`  WALLET_PUBLIC_KEY = "${process.env.WALLET_PUBLIC_KEY}"`)
  console.log(`  Length: ${process.env.WALLET_PUBLIC_KEY?.length || 0}`)
  console.log()

  console.log('Config Value:')
  console.log(`  config.wallet.publicKey = "${walletAddress}"`)
  console.log(`  Length: ${walletAddress?.length || 0}`)
  console.log()

  if (!walletAddress) {
    console.log('❌ Wallet address is empty!\n')
    return
  }

  console.log('Character Analysis:')
  console.log(`  First char: "${walletAddress[0]}" (code: ${walletAddress.charCodeAt(0)})`)
  console.log(`  Last char: "${walletAddress[walletAddress.length - 1]}" (code: ${walletAddress.charCodeAt(walletAddress.length - 1)})`)
  console.log()

  console.log('Testing PublicKey creation...')
  try {
    const pubkey = new PublicKey(walletAddress)
    console.log(`✅ Valid Solana address!`)
    console.log(`   Base58: ${pubkey.toBase58()}`)
  } catch (error) {
    console.log(`❌ Invalid Solana address!`)
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
  }
  console.log()
}
