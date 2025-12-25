import telegramService from '../services/telegram.service'

export async function testTelegramCommand() {
  console.log('\n🧪 Testing Telegram Integration...\n')

  if (!telegramService.isEnabled()) {
    console.log('❌ Telegram is not configured')
    console.log('\nMake sure you have set these environment variables:')
    console.log('  TELEGRAM_BOT_TOKEN=your_bot_token')
    console.log('  TELEGRAM_CHAT_ID=your_chat_id\n')
    return
  }

  console.log('✅ Telegram is configured')
  console.log('📤 Sending test message...\n')

  const success = await telegramService.sendTestMessage()

  if (success) {
    console.log('✅ Test successful! Check your Telegram for the message.\n')
  } else {
    console.log('❌ Test failed. Check the error above.\n')
  }
}
