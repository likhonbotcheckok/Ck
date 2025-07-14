const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');
const { loadDB } = require('../utils/db');
const { generateValidCard, getBinInfo, createCCMessage } = require('../utils/cardUtils');
const { getUserMode } = require('../utils/userMode');

module.exports = (bot) => {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    // যদি মেসেজ না থাকে বা কমপক্ষে 6 ডিজিট না হয়, স্কিপ
    if (!text || !/^\d{6,}$/.test(text)) return;

    const mode = await getUserMode(userId);
    if (mode !== 'gen') return; // 🔐 শুধুমাত্র gen মোডে থাকলে কাজ করবে

    const userDB = await loadDB();
    const isApproved = userDB.approved.includes(userId) || userId === ADMIN_UID;

    if (!isApproved) {
      return bot.sendMessage(chatId, `⛔ You are not approved to use this bot.\nAsk @${ADMIN_USERNAME} for access.`);
    }

    const bin = text.replace(/\D/g, '');
    const cards = Array.from({ length: 10 }, () => generateValidCard(bin));
    const binInfo = await getBinInfo(bin.substring(0, 8));
    const message = createCCMessage(bin, binInfo, cards);

    await bot.sendMessage(chatId, message.text, message.options);
  });
};

// ▶️ বাটনে চাপলে এই ফাংশন চালানো হবে (callback.js থেকে)
module.exports.runGenInline = async (bot, chatId) => {
  await bot.sendMessage(chatId, '💳 দয়া করে একটি BIN দিন:\n\nউদাহরণ: `515462`', {
    parse_mode: 'Markdown'
  });
};
