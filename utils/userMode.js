// utils/userMode.js

const userModes = new Map();

/**
 * Set a user's mode (e.g., 'gen', 'tempmail', '2fa')
 * @param {number} userId
 * @param {string} mode
 */
function setUserMode(userId, mode) {
  userModes.set(userId, mode);
}

/**
 * Get the current mode of a user
 * @param {number} userId
 * @returns {string|null}
 */
function getUserMode(userId) {
  return userModes.get(userId) || null;
}

/**
 * Clear a user's mode
 * @param {number} userId
 */
function clearUserMode(userId) {
  userModes.delete(userId);
}

/**
 * Check if user is in any mode
 * @param {number} userId
 * @returns {boolean}
 */
function hasMode(userId) {
  return userModes.has(userId);
}

module.exports = {
  setUserMode,
  getUserMode,
  clearUserMode,
  hasMode
};
