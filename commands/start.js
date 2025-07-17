const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    await handleStart(bot, msg.chat.id, msg.from);
  });
};

async function handleStart(bot, chatId, from, callbackId = null, messageId = null) {
  const uid = from.id;
  const username = from.username || 'NoUsername';
  const cleanUsername = username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&'); // MarkdownV2 escaping
  const isAdmin = uid === Number(ADMIN_UID);

  let userDB = await loadDB();

  const isApproved = userDB.approved.some(id => String(id) === String(uid));
  const isBanned = userDB.banned.some(id => String(id) === String(uid));
  const isPending = userDB.pending.some(id => String(id) === String(uid));

  if (isBanned) {
    return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
  }

  if (isAdmin || isApproved) {
    const status = isAdmin ? 'VIP' : 'Trial';

    const message = `
╭━━❖【 *𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐗𝟐𝟎 𝐁𝐎𝐓* 】❖━━╮

👤 𝐇𝐞𝐥𝐥𝐨 \\! *${cleanUsername}* 🐶

🌟 𝐔𝐬𝐞 𝐎𝐮𝐫 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 𝐒𝐞𝐫𝐯𝐢𝐜𝐞

💠 *Status* : \${status} \ 🟢

🔋 *Active* : 24\\/7 Hours On VPS ❇️

⚜️ *Experience Our Better Quality* ⚡

📌 *Notice* : Get VIP \\& Use Smoothly ⚠️

☎️ *Contact* : @YourAdmin

╰━━━━━⊰✨⟦ 𝐑 𝐈 𝐇 𝐀 𝐃 ⟧✨⊱━━━━━━╯
    `.trim();

    const buttons = [
      [{ text: "📋 Menu", callback_data: "menu" }],
      [{ text: "👥 Group", url: "https://t.me/likhon_premium" }]
    ];

    if (callbackId && messageId) {
      await bot.answerCallbackQuery(callbackId);
      return bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons }
      });
    } else {
      return bot.sendMessage(chatId, message, {
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }

  const restrictedMsg = `
🚫 *Access Restricted*

👋 *Hello, ${cleanUsername}\\!*  
Thanks for your interest in *PremiumBot*\\.  
🔐 *Access is limited to authorized users only\\.*

📮 *To request access:*  
Message [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME}) with your Telegram details.

🆔 *Your Telegram ID:* \`${uid}\`  
🔗 *Username:* @${username}

🙏 We appreciate your patience\\.
  `.trim();

  await bot.sendMessage(chatId, restrictedMsg, { parse_mode: 'MarkdownV2' });

  if (!isPending) {
    userDB.pending.push(uid);
    await saveDB(userDB);
    notifyAdmin(bot, uid, username, false);
  }
}
