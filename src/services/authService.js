const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Token = require('../models/Token');
const EmailService = require('./emailService');

class AuthService {
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name
    });

    await user.save();

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    await new Token({ userId: user._id, token: verificationToken }).save();

    // Send verification email
    await EmailService.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  async login(email, password) {
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email to login');
    }

    // Generate JWT token
    const token = this.generateAuthToken(user);

    // Remove password from user object
    user.password = undefined;

    return { user, token };
  }

  generateAuthToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  }

  async verifyEmail(token) {
    const verificationToken = await Token.findOne({ token });
    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    const user = await User.findOne({ _id: verificationToken.userId });
    if (!user) {
      throw new Error('User not found');
    }

    user.isVerified = true;
    await user.save();

    await Token.findByIdAndRemove(verificationToken._id);

    return user;
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate password reset token
    const resetToken = this.generateResetToken();
    await new Token({ userId: user._id, token: resetToken, type: 'reset' }).save();

    // Send password reset email
    await EmailService.sendPasswordResetEmail(user.email, resetToken);

    return true;
  }

  async resetPassword(token, newPassword) {
    const resetToken = await Token.findOne({ token, type: 'reset' });
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await User.findOne({ _id: resetToken.userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Token.findByIdAndRemove(resetToken._id);

    return true;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return true;
  }

  async logout(token) {
    // Add token to blacklist
    await new Token({ token, type: 'blacklist' }).save();
    return true;
  }

  async validateToken(token) {
    try {
      // Check if token is blacklisted
      const blacklistedToken = await Token.findOne({ token, type: 'blacklist' });
      if (blacklistedToken) {
        throw new Error('Token is blacklisted');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = this.generateAuthToken(user);
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return await User.findById(decoded.id);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();
