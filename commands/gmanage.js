const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');

module.exports = (bot) => {
  const isAdmin = (msg) => {
    const userId = msg.from.id.toString();
    const username = msg.from.username || '';
    return (
      userId === ADMIN_UID ||
      username.toLowerCase() === ADMIN_USERNAME.toLowerCase()
    );
  };

  // 🔒 LOCK COMMAND
  bot.onText(/^\/lock$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    if (!isAdmin(msg)) {
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
        can_change_info: false,
      });

      return bot.sendMessage(chatId, "🔒 পুরো গ্রুপ লকড হয়েছে ✅", {
        parse_mode: "Markdown",
        message_thread_id: msg.is_topic_message ? msg.message_thread_id : undefined,
      });
    } catch (err) {
      console.error("Lock command error:", err);
      return bot.sendMessage(chatId, "⚠️ কিছু ভুল হয়েছে লক করতে গিয়ে।");
    }
  });

  // 🔓 UNLOCK COMMAND
  bot.onText(/^\/unlock$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ এই কমান্ড শুধু গ্রুপে কাজ করে।");
    }

    if (!isAdmin(msg)) {
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
        can_change_info: false,
      });

      return bot.sendMessage(chatId, "🔓 গ্রুপ আনলকড ✅", {
        parse_mode: "Markdown",
        message_thread_id: msg.is_topic_message ? msg.message_thread_id : undefined,
      });
    } catch (err) {
      console.error("Unlock command error:", err);
      return bot.sendMessage(chatId, "⚠️ কিছু ভুল হয়েছে আনলক করতে গিয়ে।");
    }
  });
};
