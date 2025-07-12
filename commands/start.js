const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    await handleStart(bot, msg.chat.id, msg.from);
  });

  bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const uid = query.from.id;
    const messageId = query.message.message_id;
    const isAdmin = uid === Number(ADMIN_UID);

    switch (data) {
      case 'main':
        return handleStart(bot, chatId, query.from, query.id, messageId);

      case 'menu':
        return bot.editMessageText(`📜 *User Menu:*`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💳 Gen", callback_data: "gen" },
                { text: "📩 TempMail", callback_data: "tempmail" }
              ],
              [
                { text: "🔐 2FA", callback_data: "2fa" },
                { text: "🕒 Uptime", callback_data: "uptime" }
              ],
              [{ text: "🔙 Back", callback_data: "main" }]
            ]
          }
        });

      case 'adminmenu':
        if (!isAdmin) return bot.answerCallbackQuery(query.id, { text: "🚫 Unauthorized" });

        return bot.editMessageText(`👑 *Admin Menu:*`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: "📄 Users", callback_data: "users" }],
              [
                { text: "💳 Gen", callback_data: "gen" },
                { text: "📩 TempMail", callback_data: "tempmail" }
              ],
              [
                { text: "🔐 2FA", callback_data: "2fa" },
                { text: "🕒 Uptime", callback_data: "uptime" }
              ],
              [{ text: "🔙 Back", callback_data: "main" }]
            ]
          }
        });

      case 'gen':
      case 'tempmail':
      case '2fa':
      case 'uptime':
      case 'users':
        return bot.answerCallbackQuery(query.id, {
          text: `🛠 "${data}" feature not implemented yet.`,
          show_alert: true
        });

      default:
        return bot.answerCallbackQuery(query.id, {
          text: "❓ Unknown button",
          show_alert: true
        });
    }
  });
};

async function handleStart(bot, chatId, from, callbackId = null, messageId = null) {
  const uid = from.id;
  const username = from.username || 'NoUsername';
  const cleanUsername = username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  const isAdmin = uid === Number(ADMIN_UID);

  let userDB = await loadDB();

  const isApproved = userDB.approved.includes(uid);
  const isBanned = userDB.banned.includes(uid);
  const isPending = userDB.pending.includes(uid);

  if (isBanned) {
    return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
  }

  if (isAdmin || isApproved) {
    const welcomeMsg = isAdmin
      ? `👑 *Welcome Admin!*\n\nAccess your premium control panel below.`
      : `👋 *Welcome ${cleanUsername}*\n\nUse the menu below to access features.`;

    const menuButtons = [
      [
        { text: "📋 Menu", callback_data: "menu" },
        ...(isAdmin ? [{ text: "🛠 Admin Menu", callback_data: "adminmenu" }] : [])
      ]
    ];

    const messageOptions = {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: menuButtons }
    };

    if (callbackId && messageId) {
      await bot.answerCallbackQuery(callbackId);
      return bot.editMessageText(welcomeMsg, {
        chat_id: chatId,
        message_id: messageId,
        ...messageOptions
      });
    } else {
      return bot.sendMessage(chatId, welcomeMsg, messageOptions);
    }
  }

  // Not approved
  const restrictedMsg = `🚫 *Access Restricted*

👋 *Hello, ${cleanUsername}!*  
Thanks for your interest in using *PremiumBot*.

🔐 *Access is limited to authorized users only.*

📮 *To request access:*  
Message [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME}) with your Telegram details.

🆔 *Your Telegram ID:* \`${uid}\`  
🔗 *Username:* @${username}

🙏 We appreciate your patience.  
— *PremiumBot Team 🤖*`;

  await bot.sendMessage(chatId, restrictedMsg, { parse_mode: 'Markdown' });

  if (!isPending) {
    userDB.pending.push(uid);
    await saveDB(userDB);
    notifyAdmin(bot, uid, username, false);
  }
}
