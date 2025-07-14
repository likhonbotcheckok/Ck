const speakeasy = require('speakeasy');
const { getUserMode, clearUserMode } = require('../utils/userMode');

module.exports = (bot) => {
  // 📥 Listen for messages when user is in 2fa mode
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const mode = await getUserMode(userId);

    // Only run if user is in '2fa' mode and sent plain text
    if (mode === '2fa' && msg.text && !msg.text.startsWith('/')) {
      const rawKey = msg.text.trim();
      const secretKey = rawKey.replace(/\s+/g, '');

      try {
        const code = speakeasy.totp({
          secret: secretKey,
          encoding: 'base32',
          digits: 6,
          step: 30
        });

        await bot.sendMessage(chatId, `🔐 *Your 2FA Code:*\n\`${code}\``, {
          parse_mode: 'Markdown'
        });

      } catch (error) {
        await bot.sendMessage(chatId, "❌ Invalid Secret Key (Base32 not detected)");
      }

      await clearUserMode(userId);
    }
  });
};
