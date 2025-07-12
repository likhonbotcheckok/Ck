require('dotenv').config();
const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const FormData = require('form-data');

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  timeout: 10000,
  maxRedirects: 5
}));

async function login() {
  try {
    const loginPage = await client.get('https://www.pikachutools.my.id/user/login');
    const $ = cheerio.load(loginPage.data);
    const token = $('input[name="_token"]').val();

    if (!token) throw new Error('CSRF token not found');

    const loginRes = await client.post(
      'https://www.pikachutools.my.id/user/login',
      `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&_token=${encodeURIComponent(token)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://www.pikachutools.my.id',
          'Referer': 'https://www.pikachutools.my.id/user/login'
        }
      }
    );

    if (loginRes.status === 200 && loginRes.data.includes('user')) {
      return true;
    }

    return false;
  } catch (e) {
    console.error('❌ Login Error:', e.message);
    return false;
  }
}

async function sendBomb(phone, amount) {
  try {
    const userPage = await client.get('https://www.pikachutools.my.id/user');
    const $ = cheerio.load(userPage.data);
    const token = $('input[name="_token"]').val();

    if (!token) throw new Error('CSRF token not found on user page');

    const form = new FormData();
    form.append('_token', token);
    form.append('nomor', phone);
    form.append('jumlah', amount);

    const res = await client.post('https://www.pikachutools.my.id/user', form, {
      headers: {
        ...form.getHeaders(),
        'Origin': 'https://www.pikachutools.my.id',
        'Referer': 'https://www.pikachutools.my.id/user'
      }
    });

    if (res.data?.status === true || res.data?.includes('terkirim')) {
      return `✅ Bomb sent to ${phone} (${amount}x)`;
    }

    return `❌ Bomb failed: ${JSON.stringify(res.data)}`;
  } catch (e) {
    return `❌ Error: ${e.message}`;
  }
}

module.exports = (bot) => {
  bot.on('message', async (msg) => {
    const text = msg.text?.trim();
    const chatId = msg.chat.id;

    if (!text || !text.startsWith('.bomb')) return;

    const parts = text.split(' ');
    if (parts.length !== 3) {
      return bot.sendMessage(chatId, '❌ ফরম্যাট: `.bomb <phone> <amount>`');
    }

    const phone = parts[1];
    const amount = parseInt(parts[2]);

    if (!/^01[0-9]{8,9}$/.test(phone)) {
      return bot.sendMessage(chatId, '❌ সঠিক বাংলাদেশি নাম্বার দিন (01 দিয়ে)');
    }

    if (isNaN(amount) || amount <= 0 || amount > 1000) {
      return bot.sendMessage(chatId, '❌ এমাউন্ট ভুল! ১ থেকে ১০০০ পর্যন্ত দিন।');
    }

    try {
      await bot.sendMessage(chatId, '🔐 লগইন হচ্ছে...');
      const ok = await login();

      if (!ok) {
        return bot.sendMessage(chatId, '❌ লগইন ব্যর্থ! মেইল/পাসওয়ার্ড ভুল বা সাইট ডাউন।');
      }

      await bot.sendMessage(chatId, `🚀 বোম্ব শুরু: ${phone} (${amount})`);
      const result = await sendBomb(phone, amount);

      return bot.sendMessage(chatId, result);
    } catch (err) {
      return bot.sendMessage(chatId, `❌ ত্রুটি: ${err.message}`);
    }
  });
};
