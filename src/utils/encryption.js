const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Encrypt JWT token using AES
const encryptToken = (token) => {
  return CryptoJS.AES.encrypt(token, config.jwt.encryptionKey).toString();
};

// Decrypt JWT token
const decryptToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, config.jwt.encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Invalid token');
    }
    return decrypted;
  } catch (error) {
    throw new Error('Invalid or corrupted token');
  }
};

// Generate JWT token and encrypt it
const generateToken = (payload) => {
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  return encryptToken(token);
};

// Verify and decode token
const verifyToken = (encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

module.exports = { 
  encryptToken, 
  decryptToken, 
  generateToken, 
  verifyToken 
};