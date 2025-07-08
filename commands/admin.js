const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');

module.exports = (bot) => {
  // ⏺️ /approve command
  bot.onText(/\/approve (\d+)/, async (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME && msg.from.id !== ADMIN_UID) return;

    const userDB = await loadDB();
    const uid = parseInt(match[1]);

    if (!userDB.approved.includes(uid)) {
      userDB.approved.push(uid);
      userDB.pending = userDB.pending.filter(id => id !== uid);
      await saveDB(userDB);

      bot.sendMessage(uid, '✅ Your access has been approved by admin!');
      bot.sendMessage(msg.chat.id, `✅ Approved UID: \`${uid}\``, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(msg.chat.id, `⚠️ UID \`${uid}\` is already approved.`, { parse_mode: 'Markdown' });
    }
  });

  // ⏺️ /ban command
  bot.onText(/\/ban (\d+)/, async (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME && msg.from.id !== ADMIN_UID) return;

    const userDB = await loadDB();
    const uid = parseInt(match[1]);

    if (!userDB.banned.includes(uid)) {
      userDB.banned.push(uid);
      userDB.approved = userDB.approved.filter(id => id !== uid);
      userDB.pending = userDB.pending.filter(id => id !== uid);
      await saveDB(userDB);

      bot.sendMessage(uid, '🚫 You have been banned by admin.');
      bot.sendMessage(msg.chat.id, `🚫 Banned UID: \`${uid}\``, { parse_mode: 'Markdown' });
    }
  });

  // ⏺️ /remove command
  bot.onText(/\/remove (\d+)/, async (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME && msg.from.id !== ADMIN_UID) return;

    const userDB = await loadDB();
    const uid = parseInt(match[1]);

    userDB.pending = userDB.pending.filter(id => id !== uid);
    userDB.approved = userDB.approved.filter(id => id !== uid);
    await saveDB(userDB);

    bot.sendMessage(msg.chat.id, `🗑️ Removed UID: \`${uid}\``, { parse_mode: 'Markdown' });
  });
};

// ✅ Inline Admin Panel button handler
module.exports.runAdminPanelInline = async (bot, chatId) => {
  await bot.sendMessage(chatId, `⚙️ *Admin Panel*`, {
    parse_mode: "Markdown",
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
        ],
        [{ text: "🔙 Back", callback_data: "back_home" }]
      ]
    }
  });
};
