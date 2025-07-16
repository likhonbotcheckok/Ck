const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB, saveDB } = require('../utils/db');
const notifyAdmin = require('../utils/notifyAdmin');

function escape(text) {
  return text.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, '\\$1');
}

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    await handleStart(bot, msg.chat.id, msg.from);
  });
};

async function handleStart(bot, chatId, from, callbackId = null, messageId = null) {
  const uid = from.id;
  const username = from.username || 'NoUsername';
  const cleanUsername = escape(username);
  const isAdmin = uid.toString() === ADMIN_UID.toString();

  let db = await loadDB();

  const isApproved = db.approved.includes(uid);
  const isBanned = db.banned.includes(uid);
  const isPending = db.pending.includes(uid);

  if (isBanned) {
    return bot.sendMessage(chatId, '🚫 You are banned from using this bot.');
  }

  if (isAdmin || isApproved) {
    const status = isAdmin ? 'VIP' : 'Trial';

    const message =
`╭━━❖【 *𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐗𝟐𝟎 𝐁𝐎𝐓* 】❖━━╮
👤 𝐇𝐞𝐥𝐥𝐨\\! *${cleanUsername}*

🐶🌟 𝐔𝐬𝐞 𝐎𝐮𝐫 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐐𝐮𝐚𝐥𝐭𝐲 𝐒𝐞𝐫𝐯𝐢𝐜𝐞  
🟢💠 *𝐒𝐭𝐚𝐭𝐮𝐬* : [ *${status}* ]

❇️🔋 𝐀𝐜𝐭𝐢𝐯𝐞 : 24\\/7 𝐇𝐨𝐮𝐫𝐬 𝐎𝐧 𝐕𝐏𝐒  
⚡⚜️ 𝐄𝐱𝐩𝐞𝐫𝐢𝐧𝐜𝐞 𝐎𝐮𝐫 𝐁𝐞𝐭𝐭𝐞𝐫 𝐐𝐮𝐚𝐢𝐥𝐭𝐲

🚀📌 *𝐍𝐨𝐭𝐢𝐜𝐞* : 𝐆𝐞𝐭 𝐕𝐈𝐏 𝐔𝐬𝐞 𝐒𝐦𝐨𝐨𝐭𝐡𝐥𝐲  
⚠️☎️ *𝐂𝐨𝐧𝐭𝐚𝐜𝐭* : @${ADMIN_USERNAME}

╰━━━━━⊰✨⟦ *𝐑 𝐈 𝐇 𝐀 𝐃* ⟧✨⊱━━━━━━╯`;

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

  const restrictedMsg = 
`🚫 *Access Restricted*

👋 *Hello, ${cleanUsername}!*
Thanks for your interest in using *PremiumBot*\\.

🔐 *Access is limited to authorized users only*\\.

📮 *To request access:*  
Message [@${ADMIN_USERNAME}](https://t.me/${ADMIN_USERNAME}) with your Telegram details\\.

🆔 *Your Telegram ID:* \`${uid}\`  
🔗 *Username:* @${username}

🙏 We appreciate your patience\\.`

  await bot.sendMessage(chatId, restrictedMsg, { parse_mode: 'MarkdownV2' });

  if (!isPending) {
    db.pending.push(uid);
    await saveDB(db);
    notifyAdmin(bot, uid, username, false);
  }
}
