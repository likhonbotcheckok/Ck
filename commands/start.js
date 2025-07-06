const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const uid = msg.from.id;
    const username = msg.from.username || 'NoUsername';

    const userDB = loadDB();

    const isAdmin =
      uid === ADMIN_UID || (username && username.toLowerCase() === ADMIN_USERNAME.toLowerCase());

    const isApproved = userDB.approved.includes(uid);
    const isBanned = userDB.banned.includes(uid);
    const isPending = userDB.pending.includes(uid);

    if (isBanned) {
      return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
    }

    // ✅ Admin gets direct access
    if (isAdmin || isApproved) {
      return bot.sendMessage(chatId, `🎉 Welcome @${username}!\nUse the buttons below:`, {
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
    }

    // ⏳ If not approved and not admin, add to pending
    if (!isPending) {
      userDB.pending.push(uid);
      saveDB(userDB);
      notifyAdmin(bot, uid, username, false); // Only notify if newly pending
    } else {
      notifyAdmin(bot, uid, username, true); // Repeated pending
    }

    bot.sendMessage(chatId, `⏳ Your access is pending approval by @${ADMIN_USERNAME}.\nPlease wait...`);
  });
};
