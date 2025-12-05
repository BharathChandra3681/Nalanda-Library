const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    encryptionKey: process.env.JWT_ENCRYPTION_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};