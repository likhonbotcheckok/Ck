const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  // /start command
  bot.onText(/\/start/, async (msg) => {
    await handleStart(bot, msg.chat.id, msg.from);
  });

  // Button click handler
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const from = query.from;
    const messageId = query.message.message_id;

    if (data === 'menu') {
      const uid = from.id;
      const username = from.username || 'NoUsername';
      const isAdmin = uid === Number(ADMIN_UID);

      const buttons = isAdmin
        ? [
            [{ text: "📄 Users", callback_data: "users" }],
            [
              { text: "💳 Gen", callback_data: "gen" },
              { text: "📩 TempMail", callback_data: "tempmail" }
            ],
            [
              { text: "🔐 2FA", callback_data: "2fa" },
              { text: "🕒 Uptime", callback_data: "uptime" }
            ],
            [{ text: "🔙 Back", callback_data: "back_to_home" }]
          ]
        : [
            [
              { text: "💳 Gen", callback_data: "gen" },
              { text: "📩 TempMail", callback_data: "tempmail" }
            ],
            [
              { text: "🔐 2FA", callback_data: "2fa" },
              { text: "🕒 Uptime", callback_data: "uptime" }
            ],
            [{ text: "🔙 Back", callback_data: "back_to_home" }]
          ];

      await bot.answerCallbackQuery(query.id);
      return bot.editMessageText("📋 *Command Menu*\nSelect an option below:", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons }
      });
    }

    if (data === 'back_to_home') {
      await handleStart(bot, chatId, from, query.id, messageId);
    }
  });
};

async function handleStart(bot, chatId, from, callbackId = null, messageId = null) {
  const uid = from.id;
  const username = from.username || 'NoUsername';
  const cleanUsername = username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  const isAdmin = uid === Number(ADMIN_UID);

  let userDB = await loadDB();

  const isApproved = userDB.approved.some(id => String(id) === String(uid));
  const isBanned = userDB.banned.some(id => String(id) === String(uid));
  const isPending = userDB.pending.some(id => String(id) === String(uid));

  if (isBanned) {
    return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
  }

  if (isAdmin || isApproved) {
    const message = `👋 *Hello, ${cleanUsername}!*  
Welcome to *PremiumBot*.

Tap any option below to continue.`;

    const buttons = [
      [{ text: "📋 Menu", callback_data: "menu" }],
      [{ text: "👥 Group", url: "https://t.me/likhon_premium" }]
    ];

    if (callbackId && messageId) {
      await bot.answerCallbackQuery(callbackId);
      return bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    } else {
      return bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }

  const restrictedMsg = `🚫 *Access Restricted*

👋 *Hello, ${cleanUsername}!*
Thanks for your interest in using *PremiumBot*.

🔐 *Access is limited to authorized users only.*

📮 *To request access:*  
Message [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME}) with your Telegram details.

🆔 *Your Telegram ID:* \`${uid}\`  
🔗 *Username:* @${username || 'NoUsername'}

🙏 We appreciate your patience.`;

  await bot.sendMessage(chatId, restrictedMsg, { parse_mode: 'Markdown' });

  if (!isPending) {
    userDB.pending.push(uid);
    await saveDB(userDB);
    notifyAdmin(bot, uid, username, false);
  }
}
