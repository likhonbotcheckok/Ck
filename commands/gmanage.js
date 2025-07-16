const { ADMIN_UID, ADMIN_USERNAME } = require('../config/botConfig');

module.exports = (bot) => {
  // 🔒 Lock command
  bot.onText(/^\/lock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = msg.from.username || '';

    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ This command only works in group chats.");
    }

    if (
      userId !== ADMIN_UID &&
      username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()
    ) {
      return bot.sendMessage(chatId, "⛔ Only admins can use this command.");
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

      return bot.sendMessage(chatId, "🔒 The group has been *locked*.", {
        parse_mode: "Markdown"
      });

    } catch (err) {
      console.error("❌ Lock command error:", err);
      return bot.sendMessage(chatId, "⚠️ An error occurred while locking the group.");
    }
  });

  // 🔓 Unlock command
  bot.onText(/^\/unlock$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = msg.from.username || '';

    if (!['group', 'supergroup'].includes(msg.chat.type)) {
      return bot.sendMessage(chatId, "❌ This command only works in group chats.");
    }

    if (
      userId !== ADMIN_UID &&
      username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()
    ) {
      return bot.sendMessage(chatId, "⛔ Only admins can use this command.");
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

      return bot.sendMessage(chatId, "🔓 The group has been *unlocked*.", {
        parse_mode: "Markdown"
      });

    } catch (err) {
      console.error("❌ Unlock command error:", err);
      return bot.sendMessage(chatId, "⚠️ An error occurred while unlocking the group.");
    }
  });
};
