require('dotenv').config();

module.exports = {
  ADMIN_UID: process.env.ADMIN_UID,              // Telegram UID (string)
  ADMIN_USERNAME: process.env.ADMIN_USERNAME     // Username (without @)
};
