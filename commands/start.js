const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    if (msg.chat.type !== 'private') return;
    await sendMainMenu(bot, msg.chat.id, msg.from);
  });

  bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const uid = query.from.id;
    const messageId = query.message.message_id;

    const isAdmin = uid === Number(ADMIN_UID);

    if (data === 'main') {
      return sendMainMenu(bot, chatId, query.from, query.id, messageId);
    }

    if (data === 'menu') {
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
    }

    if (data === 'adminmenu' && isAdmin) {
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
    }
  });
};

async function sendMainMenu(bot, chatId, from, callbackId = null, messageId = null) {
  const uid = from.id;
  const username = from.username || 'NoUsername';
  const cleanUsername = username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  const isAdmin = uid === Number(ADMIN_UID);

  let userDB = global.userDB || await loadDB();
  const isApproved = userDB.approved.includes(uid);
  const isBanned = userDB.banned.includes(uid);
  const isPending = userDB.pending.includes(uid);

  if (isBanned) {
    return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
  }

  if (isApproved || isAdmin) {
    const text = isAdmin
      ? `👋 *Welcome, Admin ${cleanUsername}!*`
      : `👋 *Welcome, ${cleanUsername}!*`;

    const baseButtons = [
      [{ text: "📜 Menu", callback_data: "menu" }]
    ];

    if (isAdmin) {
      baseButtons.push([{ text: "👑 Admin Menu", callback_data: "adminmenu" }]);
    }

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: baseButtons
      }
    };

    if (callbackId && messageId) {
      await bot.answerCallbackQuery(callbackId);
      return bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
    } else {
      return bot.sendMessage(chatId, text, options);
    }
  }

  // Not approved yet
  const restrictedMsg = `🚫 *Access Restricted*\n\n` +
    `Hi ${cleanUsername}, this bot is private.\n` +
    `🆔 *Your ID:* \`${uid}\`\n\n` +
    `Request access from [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME})`;

  await bot.sendMessage(chatId, restrictedMsg, { parse_mode: 'Markdown' });

  if (!isPending) {
    userDB.pending.push(uid);
    await saveDB(userDB);
    global.userDB = userDB;
    notifyAdmin(bot, uid, username, false);
  }
}
