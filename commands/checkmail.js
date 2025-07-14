const checkEmail = require('../utils/emailChecker');
const { getUserMode } = require('../utils/userMode');

module.exports = (bot) => {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    const userId = msg.from.id;

    // যদি কোনো কমান্ড হয়, স্কিপ করো
    if (!text || text.startsWith('/') || text.startsWith('.')) return;

    const mode = await getUserMode(userId);
    if (mode === 'tempmail') {
      await handleCheck(bot, chatId, text);
    }
  });
};

async function handleCheck(bot, chatId, username) {
  const sent = await bot.sendMessage(chatId, `📮 *Checking inbox for:* \`${username}\`\n⏳ অপেক্ষা করুন...`, {
    parse_mode: 'Markdown'
  });

  try {
    const { success, content } = await checkEmail(username);
    if (success) {
      await bot.editMessageText(content, {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.editMessageText(`❌ \`${username}\` নামে কোনো ইমেইল পাওয়া যায়নি`, {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: 'Markdown'
      });
    }
  } catch (err) {
    console.error('❌ Email check error:', err.message);
    await bot.editMessageText('⚠️ ইমেইল চেক করতে সমস্যা হয়েছে', {
      chat_id: chatId,
      message_id: sent.message_id
    });
  }
}
