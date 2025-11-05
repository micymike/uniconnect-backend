const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateReferralCode = (username) => {
  const cleanUsername = username.toLowerCase().replace(/\s/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanUsername}${randomNum}`;
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateUniqueId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const formatResponse = (success, message, data = null, error = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (error !== null) response.error = error;
  return response;
};

module.exports = {
  generateReferralCode,
  generateToken,
  hashPassword,
  comparePassword,
  generateUniqueId,
  sanitizeUser,
  formatResponse
};
