const { loadDB, saveDB } = require('../utils/db');
const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { setUserMode, clearUserMode } = require('../utils/userMode');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  bot.on('callback_query', async (query) => {
    const data = query.data;
    const userId = query.from.id;
    const username = query.from.username || "NoUsername";
    const cleanUsername = username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

    const chatId = query.message?.chat?.id;
    const messageId = query.message?.message_id;

    if (!chatId || !messageId) {
      console.error("❌ Missing chatId or messageId in callback_query");
      return bot.answerCallbackQuery(query.id, {
        text: "⚠️ Message not found.",
        show_alert: true
      });
    }

    const db = await loadDB();

    const isAdmin = (
      username?.toLowerCase() === ADMIN_USERNAME?.toLowerCase() ||
      userId.toString() === ADMIN_UID.toString()
    );
    const isApproved = db.approved.includes(userId);
    const isPending = db.pending.includes(userId);
    const isBanned = db.banned.includes(userId);

    try {
      switch (data) {
        case 'menu':
          await bot.answerCallbackQuery(query.id);
          const menuButtons = isAdmin
            ? [
                [{ text: "🧾 Users", callback_data: "users" }],
                [
                  { text: "💳 Gen", callback_data: "gen" },
                  { text: "📩 TempMail", callback_data: "tempmail" }
                ],
                [
                  { text: "🔐 2FA", callback_data: "2fa" },
                  { text: "🕒 Uptime", callback_data: "uptime" }
                ],
                [{ text: "🔙 Back", callback_data: "back" }]
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
                [{ text: "🔙 Back", callback_data: "back" }]
              ];
          return bot.editMessageText("📋 *Command Menu*\nSelect an option below:", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: menuButtons }
          });

        case 'gen':
          await setUserMode(userId, 'gen');
          return bot.editMessageText(`💳 You are now in *Gen Mode*\n\nUse /gen <bin>\nExample:\n/gen 515462`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu' }]]
            }
          });

        case 'tempmail':
          await setUserMode(userId, 'tempmail');
          return bot.editMessageText(`📩 You are now in *TempMail Mode*\n\nUse .tempmail <username>\nExample:\n.tempmail rihad123`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu' }]]
            }
          });

        case '2fa':
          await setUserMode(userId, '2fa');
          return bot.editMessageText(`🔐 You are now in *2FA Mode*\n\n*Now send your secret key only.*\nExample:\n\`JBSWY3DPEHPK3PXP\``, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu' }]]
            }
          });

        case 'uptime':
          const uptime = Math.floor((Date.now() - global.botStartTime) / 1000);
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;

          const uptimeText = `🕒 *Bot Uptime:*\n${hours}h ${minutes}m ${seconds}s`;
          return bot.editMessageText(uptimeText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu' }]]
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
              inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu' }]]
            }
          });

        case 'back':
          await clearUserMode(userId);
          if (isBanned) {
            return bot.editMessageText('🚫 You are banned from using this bot.', {
              chat_id: chatId,
              message_id: messageId
            });
          }
          if (isAdmin || isApproved) {
            return bot.editMessageText(`👋 *Hello, ${cleanUsername}!*  
Welcome back to *PremiumBot*.`, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📋 Menu", callback_data: "menu" }],
                  [{ text: "👥 Group", url: "https://t.me/likhon_premium" }]
                ]
              }
            });
          }
          if (!isPending) {
            db.pending.push(userId);
            await saveDB(db);
            notifyAdmin(bot, userId, username, false);
          }
          return bot.editMessageText(`🚫 *Access Restricted*\n\n🔐 Contact [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME}) for access.\n\n🆔 \`${userId}\``, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });

        default:
          return bot.answerCallbackQuery(query.id, {
            text: "❗ Unknown button clicked.",
            show_alert: true
          });
      }

    } catch (err) {
      console.error("❌ Callback error:", err);
      return bot.sendMessage(chatId, '❌ An error occurred while processing your request.');
    }
  });
};
