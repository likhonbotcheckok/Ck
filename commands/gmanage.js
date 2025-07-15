const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig'); // ✅ From config file

module.exports = (bot) => {
  // 🔒 Lock command
  bot.onText(/^\/lock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = msg.from.username || '';

    if (msg.chat.type === 'private') {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    // ✅ Admin check
    if (
      userId !== ADMIN_UID &&
      username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()
    ) {
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
      console.error("❌ Lock command error:", err);
      return bot.sendMessage(chatId, "⚠️ কিছু ভুল হয়েছে লক করতে গিয়ে।");
    }
  });

  // 🔓 Unlock command
  bot.onText(/^\/unlock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = msg.from.username || '';

    if (msg.chat.type === 'private') {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    // ✅ Admin check
    if (
      userId !== ADMIN_UID &&
      username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()
    ) {
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
      console.error("❌ Unlock command error:", err);
      return bot.sendMessage(chatId, "⚠️ কিছু ভুল হয়েছে আনলক করতে গিয়ে।");
    }
  });
};
