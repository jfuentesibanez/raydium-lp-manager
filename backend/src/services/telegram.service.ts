import TelegramBot from 'node-telegram-bot-api'
import config from '../config'
import { PositionInfo, RebalanceDecision } from '../core/rebalance-strategy'

class TelegramService {
  private bot: TelegramBot | null = null
  private chatId: string | null = null
  private enabled: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      console.log('⚠️  Telegram notifications disabled (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)')
      return
    }

    try {
      this.bot = new TelegramBot(token, { polling: false })
      this.chatId = chatId
      this.enabled = true
      console.log('✅ Telegram notifications enabled')
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error)
    }
  }

  /**
   * Send a startup notification
   */
  async sendStartupMessage(): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) return

    const message = `
🤖 *Raydium LP Monitor Started*

✅ Auto-rebalance bot is now running
📊 Checking positions every ${process.env.MONITOR_INTERVAL || 5} minutes
🔍 Wallet: \`${config.wallet.publicKey?.slice(0, 20)}...\`

I'll notify you when rebalancing is recommended!
`

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Failed to send Telegram startup message:', error)
    }
  }

  /**
   * Send position check summary
   */
  async sendCheckSummary(
    totalPositions: number,
    outOfRangeCount: number,
    totalValue: number,
    totalFees: number
  ): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) return

    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const emoji = outOfRangeCount > 0 ? '⚠️' : '✅'

    const message = `
${emoji} *Position Check - ${timestamp}*

📊 *Summary*
• Total Positions: ${totalPositions}
• In Range: ${totalPositions - outOfRangeCount}
• Out of Range: ${outOfRangeCount}

💰 *Portfolio*
• Total Value: $${totalValue.toFixed(2)}
• Pending Fees: $${totalFees.toFixed(2)}
`

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Failed to send Telegram summary:', error)
    }
  }

  /**
   * Send rebalance recommendation alert
   */
  async sendRebalanceAlert(
    position: PositionInfo,
    decision: RebalanceDecision
  ): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) return

    const emoji = decision.shouldRebalance ? '🔄' : '⏸️'
    const action = decision.shouldRebalance ? 'RECOMMENDED' : 'NOT RECOMMENDED'

    const message = `
${emoji} *Rebalance ${action}*

📍 *Position: ${position.poolName}*
• Status: 🔴 Out of Range
• Value: $${position.totalValueUSD.toFixed(2)}

📊 *Price Info*
• Current: $${position.currentPrice.toFixed(4)}
• Range: $${position.priceMin.toFixed(4)} - $${position.priceMax.toFixed(4)}
• Pending Fees: $${position.pendingFeesUSD.toFixed(2)}

${decision.shouldRebalance ? '✅' : '❌'} *Decision: ${decision.reason}*

${decision.newPriceMin && decision.newPriceMax ? `💡 *Proposed New Range*
• Min: $${decision.newPriceMin.toFixed(4)}
• Max: $${decision.newPriceMax.toFixed(4)}
• Est. Gas: $${decision.estimatedGasCost?.toFixed(4) || 'N/A'}
` : ''}
${decision.shouldRebalance ? '⚡ *Action Required!*\nConsider rebalancing this position manually.' : ''}
`

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Failed to send Telegram rebalance alert:', error)
    }
  }

  /**
   * Send error notification
   */
  async sendError(error: string): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) return

    const message = `
❌ *Monitor Error*

\`\`\`
${error}
\`\`\`

The bot is still running but encountered an issue.
`

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
    } catch (err) {
      console.error('Failed to send Telegram error:', err)
    }
  }

  /**
   * Test the Telegram connection
   */
  async sendTestMessage(): Promise<boolean> {
    if (!this.enabled || !this.bot || !this.chatId) {
      console.log('❌ Telegram not configured')
      return false
    }

    try {
      await this.bot.sendMessage(
        this.chatId,
        '🧪 *Test Message*\n\nTelegram notifications are working correctly! ✅',
        { parse_mode: 'Markdown' }
      )
      console.log('✅ Test message sent successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to send test message:', error)
      return false
    }
  }

  /**
   * Check if Telegram is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export default new TelegramService()
