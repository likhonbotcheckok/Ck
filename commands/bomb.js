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

    if (!token) throw new Error('❌ CSRF token না পাওয়া গেছে login পেইজে');

    const res = await client.post(
      'https://www.pikachutools.my.id/user/login',
      `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&_token=${encodeURIComponent(token)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://www.pikachutools.my.id/user/login',
          'Origin': 'https://www.pikachutools.my.id'
        }
      }
    );

    console.log('🔐 Login response status:', res.status);
    return res.status === 200 && res.data.includes('user');
  } catch (e) {
    console.error('❌ Login error:', e.message);
    return false;
  }
}

async function sendBomb(phone, amount) {
  try {
    const userPage = await client.get('https://www.pikachutools.my.id/user');
    const $ = cheerio.load(userPage.data);
    const token = $('input[name="_token"]').val();

    if (!token) throw new Error('❌ CSRF token না পাওয়া গেছে user পেইজে');

    const form = new FormData();
    form.append('_token', token);
    form.append('nomor', phone);
    form.append('jumlah', amount);

    const res = await client.post('https://www.pikachutools.my.id/user', form, {
      headers: {
        ...form.getHeaders(),
        'Referer': 'https://www.pikachutools.my.id/user',
        'Origin': 'https://www.pikachutools.my.id'
      }
    });

    console.log('📨 Bomb response:', res.data);

    if (res.data?.status === true) {
      return `✅ Bomb sent to ${phone} (${amount}x)`;
    }

    return `❌ Bomb failed: ${JSON.stringify(res.data)}`;
  } catch (e) {
    console.error('❌ Bomb Error:', e.message);
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

    await bot.sendMessage(chatId, '🔐 লগইন হচ্ছে...');
    const success = await login();

    if (!success) {
      return bot.sendMessage(chatId, '❌ লগইন ব্যর্থ! .env ফাইল চেক করুন।');
    }

    await bot.sendMessage(chatId, `🚀 বোম্ব শুরু: ${phone} (${amount})`);
    const result = await sendBomb(phone, amount);

    return bot.sendMessage(chatId, result);
  });
};
