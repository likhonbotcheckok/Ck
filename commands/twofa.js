const speakeasy = require('speakeasy');
const { getUserMode, clearUserMode } = require('../utils/userMode');

module.exports = (bot) => {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const mode = await getUserMode(userId);

    // ✅ 2FA mode এ আছে কিনা চেক করো
    if (mode === '2fa' && msg.text) {
      const text = msg.text.trim();

      // ✅ .2fa দিয়ে শুরু কিনা চেক করো
      if (text.startsWith('.2fa')) {
        const parts = text.split(' ');

        if (parts.length < 2) {
          await bot.sendMessage(chatId, "⚠️ Usage:\n`.2fa <secret_key>`", {
            parse_mode: 'Markdown'
          });
          return;
        }

        const rawKey = parts[1].trim();
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
          await bot.sendMessage(chatId, "❌ Invalid Secret Key (Base32 format only)");
        }

        await clearUserMode(userId);
      }
    }
  });
};
