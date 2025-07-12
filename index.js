require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadDB, saveDB } = require('./utils/db');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Optional middleware (future proofing)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variables
global.botStartTime = Date.now();
global.activeEmails = {};
global.userDB = { approved: [], pending: [], banned: [] };

// ======================
// Helper Functions
// ======================

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  try {
    const db = await loadDB();
    global.userDB = db;
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.log('⚠️ Using empty database as fallback');
  }
}

function loadCommands(bot) {
  const commandsPath = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error('❌ Commands directory not found');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  if (commandFiles.length === 0) {
    console.warn('⚠️ No command files found');
    return;
  }

  commandFiles.forEach(file => {
    try {
      const command = require(path.join(commandsPath, file));
      if (typeof command === 'function') {
        command(bot);
        console.log(`✅ Loaded command: ${file}`);
      } else {
        console.error(`❌ ${file} does not export a function`);
      }
    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err.message);
    }
  });
}

// ======================
// Main Bot Initialization
// ======================

async function startBot() {
  try {
    if (!process.env.BOT_TOKEN) {
      throw new Error('Missing BOT_TOKEN in environment variables');
    }

    await initializeDatabase();

    // ✅ Polling always true as you requested
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    console.log('🤖 Bot instance created');

    bot.on('polling_error', (error) => {
      console.error('🔴 Polling error:', error.message);
    });

    loadCommands(bot);

    app.get('/', (req, res) => {
      res.json({
        status: 'running',
        uptime: Date.now() - global.botStartTime,
        commands: bot._textRegexCallbacks ? Object.keys(bot._textRegexCallbacks).length : 0
      });
    });

    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        uptime: `${(Date.now() - global.botStartTime) / 1000} seconds`
      });
    });

    app.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`✅ Bot is fully operational (Started at ${new Date(global.botStartTime)})`);
    });

  } catch (error) {
    console.error('🔥 Critical initialization error:', error.message);
    process.exit(1);
  }
}

// ======================
// Start the Application
// ======================

startBot();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Keyboard interrupt detected');
  process.exit(0);
});
