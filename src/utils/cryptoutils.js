const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class CryptoUtils {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.secretKey = process.env.CRYPTO_SECRET_KEY;
    this.iv = crypto.randomBytes(16);
  }

  /**
   * Hashes a password using bcrypt
   * @param {string} password - The password to hash
   * @returns {Promise<string>} The hashed password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a password with a hashed password
   * @param {string} password - The password to compare
   * @param {string} hashedPassword - The hashed password to compare against
   * @returns {Promise<boolean>} True if the password matches, false otherwise
   */
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generates a JWT token
   * @param {Object} payload - The payload to include in the token
   * @param {string} expiresIn - The expiration time for the token
   * @returns {string} The generated JWT token
   */
  generateJWT(payload, expiresIn = '1h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  /**
   * Verifies a JWT token
   * @param {string} token - The token to verify
   * @returns {Object} The decoded token payload
   */
  verifyJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Encrypts a string
   * @param {string} text - The text to encrypt
   * @returns {string} The encrypted text
   */
  encrypt(text) {
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${this.iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted string
   * @param {string} encryptedText - The text to decrypt
   * @returns {string} The decrypted text
   */
  decrypt(encryptedText) {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generates a random string
   * @param {number} length - The length of the string to generate
   * @returns {string} The generated random string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hashes a string using SHA256
   * @param {string} text - The text to hash
   * @returns {string} The hashed text
   */
  hashSHA256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Creates an HMAC signature
   * @param {string} data - The data to sign
   * @param {string} secret - The secret key for the HMAC
   * @returns {string} The HMAC signature
   */
  createHmacSignature(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verifies an HMAC signature
   * @param {string} data - The original data
   * @param {string} signature - The HMAC signature to verify
   * @param {string} secret - The secret key for the HMAC
   * @returns {boolean} True if the signature is valid, false otherwise
   */
  verifyHmacSignature(data, signature, secret) {
    const computedSignature = this.createHmacSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  }

  /**
   * Generates a secure random token
   * @param {number} length - The length of the token to generate
   * @returns {string} The generated token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Masks a credit card number
   * @param {string} cardNumber - The credit card number to mask
   * @returns {string} The masked credit card number
   */
  maskCreditCard(cardNumber) {
    return cardNumber.replace(/^(\d{4})\d+(\d{4})$/, '$1********$2');
  }

  /**
   * Generates a unique identifier
   * @returns {string} A unique identifier
   */
  generateUUID() {
    return crypto.randomUUID();
  }
}

module.exports = new CryptoUtils();
