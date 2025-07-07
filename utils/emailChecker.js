const axios = require('axios');

const DOMAINS = [
  '@iicloud.com.vn',
  '@mail10s.top',
  '@hotmail999.com',
  '@mailshopee.io.vn',
  '@gmail.com'
];

async function checkEmail(username, chatId, bot) {
  try {
    await bot.sendMessage(chatId, `⏳ *${username}* এর জন্য ইমেইল খোঁজা হচ্ছে...`, { parse_mode: 'Markdown' });

    let found = false;

    for (const domain of DOMAINS) {
      const email = `${username}${domain}`;
      const apiUrl = `https://hotmail999.com/api/get_mail.php?email=${encodeURIComponent(email)}`;

      try {
        const { data } = await axios.get(apiUrl);

        if (data?.status && data?.data?.length > 0) {
          const mail = data.data[0];
          const msg = `
📭 *ইমেইল পাওয়া গেছে!*
✉️ *ঠিকানা:* \`${email}\`
🕒 *সময়:* ${mail.date || 'Unknown'}
📧 *প্রেরক:* ${mail.from_field || 'Unknown'}
📝 *বিষয়:* ${mail.subject || 'No Subject'}
🔢 *OTP কোড:* \`${mail.code || 'Not Found'}\`
          `;

          await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
          found = true;
          break;
        }
      } catch (error) {
        console.error(`Error checking ${email}:`, error.message);
      }
    }

    if (!found) {
      await bot.sendMessage(chatId, `❌ *${username}* নামে কোনো ইমেইল পাওয়া যায়নি`, { parse_mode: 'Markdown' });
    }

  } catch (error) {
    console.error('General error in checkEmail:', error);
    bot.sendMessage(chatId, '⚠️ সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করুন');
  }
}

module.exports = checkEmail;
