module.exports = (bot) => {
  const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');

  async function isAdmin(bot, chatId, userId) {
    try {
      const member = await bot.getChatMember(chatId, userId);
      return ['administrator', 'creator'].includes(member.status);
    } catch (err) {
      console.error("🔴 Admin check error:", err);
      return false;
    }
  }

  // 🔒 Lock
  bot.onText(/^\/lock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    const adminCheck = await isAdmin(bot, chatId, userId);
    if (!adminCheck) {
      return bot.sendMessage(chatId, "⛔ শুধুমাত্র অ্যাডমিনরা এই কমান্ড চালাতে পারে।");
    }

    try {
      await bot.setChatPermissions(chatId, {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_change_info: false
      });
      return bot.sendMessage(chatId, "🔒 গ্রুপ এখন *লকড* করা হয়েছে।", {
        parse_mode: "Markdown"
      });
    } catch (err) {
      console.error("❌ Lock error:", err);
      return bot.sendMessage(chatId, "⚠️ লক করতে সমস্যা হয়েছে।");
    }
  });

  // 🔓 Unlock
  bot.onText(/^\/unlock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    const adminCheck = await isAdmin(bot, chatId, userId);
    if (!adminCheck) {
      return bot.sendMessage(chatId, "⛔ শুধুমাত্র অ্যাডমিনরা এই কমান্ড চালাতে পারে।");
    }

    try {
      await bot.setChatPermissions(chatId, {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_invite_users: true,
        can_pin_messages: true,
        can_change_info: false
      });
      return bot.sendMessage(chatId, "🔓 গ্রুপ এখন *আনলকড* করা হয়েছে।", {
        parse_mode: "Markdown"
      });
    } catch (err) {
      console.error("❌ Unlock error:", err);
      return bot.sendMessage(chatId, "⚠️ আনলক করতে সমস্যা হয়েছে।");
    }
  });
};
