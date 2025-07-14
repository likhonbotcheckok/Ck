const { loadDB } = require('../utils/db');
const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');

module.exports = (bot) => {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    const username = query.from.username || "NoUsername";
    const userId = query.from.id;

    const db = await loadDB();

    const isAdmin = (
      (username?.toLowerCase() === ADMIN_USERNAME?.toLowerCase()) ||
      (userId.toString() === ADMIN_UID.toString())
    );
    const isApproved = db.approved.map(id => id.toString()).includes(userId.toString());

    try {
      switch (data) {
        case 'gen':
          return bot.editMessageText(`💳 Use /gen <bin> to generate credit cards.\n\nExample:\n/gen 515462`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back' }]]
            }
          });

        case 'tempmail':
          return bot.editMessageText(`📩 Use .tempmail <username>\n\nExample:\n.tempmail rihad123`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back' }]]
            }
          });

        case '2fa':
          return bot.editMessageText(`🔐 Use .2fa <secret_key>\n\nExample:\n.2fa JBSWY3DPEHPK3PXP`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back' }]]
            }
          });

        case 'users':
          if (!isAdmin) {
            return bot.answerCallbackQuery(query.id, {
              text: "⛔ Admin access only",
              show_alert: true
            });
          }

          const format = (arr) => arr.length ? arr.map(id => `\`${id}\``).join(', ') : '_None_';
          const usersText =
            `👥 *User List:*\n\n` +
            `✅ *Approved:* ${format(db.approved)}\n` +
            `🕓 *Pending:* ${format(db.pending)}\n` +
            `🚫 *Banned:* ${format(db.banned)}`;

          return bot.editMessageText(usersText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'admin_panel' }]]
            }
          });

        case 'admin_panel':
          if (!isAdmin) {
            return bot.answerCallbackQuery(query.id, {
              text: "⛔ Admin access only",
              show_alert: true
            });
          }

          return bot.editMessageText(`👑 Admin Panel for @${username}`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "🧾 Users", callback_data: "users" }],
                [
                  { text: "💳 Gen", callback_data: "gen" },
                  { text: "📩 TempMail", callback_data: "tempmail" }
                ],
                [
                  { text: "🔐 2FA", callback_data: "2fa" },
                  { text: "🕒 Uptime", callback_data: "uptime" }
                ]
              ]
            }
          });

        case 'back':
          if (isAdmin) {
            return bot.editMessageText(`👑 Welcome Admin @${username}!`, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🧾 Users", callback_data: "users" }],
                  [
                    { text: "💳 Gen", callback_data: "gen" },
                    { text: "📩 TempMail", callback_data: "tempmail" }
                  ],
                  [
                    { text: "🔐 2FA", callback_data: "2fa" },
                    { text: "🕒 Uptime", callback_data: "uptime" }
                  ]
                ]
              }
            });
          } else if (isApproved) {
            return bot.editMessageText(`🎉 Welcome ${username}!\nUse the buttons below:`, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "💳 Gen", callback_data: "gen" },
                    { text: "📩 TempMail", callback_data: "tempmail" }
                  ],
                  [
                    { text: "🔐 2FA", callback_data: "2fa" },
                    { text: "🕒 Uptime", callback_data: "uptime" }
                  ]
                ]
              }
            });
          } else {
            return bot.answerCallbackQuery(query.id, {
              text: "⛔ Access denied.",
              show_alert: true
            });
          }

        default:
          return bot.answerCallbackQuery(query.id, {
            text: "❗ Unknown button clicked.",
            show_alert: true
          });
      }
    } catch (err) {
      console.error("❌ Callback error:", err);
      bot.sendMessage(chatId, '❌ An error occurred while processing your request.');
    }
  });
};
