const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Stats = require('../models/Stats');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Create stats for the new user
    const stats = new Stats({
      user: user._id,
    });

    await stats.save();

    // Send welcome onboarding email asynchronously (don't await)
    // This will run in the background and not block the registration response
    emailService.sendWelcomeEmail({
      name: user.name,
      email: user.email
    })
      .then(() => console.log('Welcome email sent successfully to:', user.email))
      .catch(emailError => console.error('Error sending welcome email:', emailError));

    // Return success message without token to require explicit login
    res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        isAdmin: user.isAdmin, // Include isAdmin flag in the response
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Update user's password (will be hashed by the pre-save hook)
    user.password = tempPassword;
    await user.save();

    // Create HTML email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d95550;">AI Pomo - Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your AI Pomo account.</p>
        <p>Your temporary password is: <strong>${tempPassword}</strong></p>
        <p>Please use this password to log in, and then change your password immediately in your account settings.</p>
        <p>If you didn't request this password reset, please contact us immediately.</p>
        <p>Best regards,<br>The AI Pomo Team</p>
      </div>
    `;

    // Create plain text email content
    const text = `
      Hello ${user.name},

      You requested a password reset for your AI Pomo account.

      Your temporary password is: ${tempPassword}

      Please use this password to log in, and then change your password immediately in your account settings.

      If you didn't request this password reset, please contact us immediately.

      Best regards,
      The AI Pomo Team
    `;

    // Send password reset email asynchronously
    // Respond to the user immediately without waiting for the email to be sent
    res.status(200).json({ message: 'Password reset email sent successfully' });

    // Send the email in the background
    emailService.sendEmail({
      to: email,
      subject: 'Password Reset - AI Pomo',
      text,
      html,
    })
      .then(() => console.log('Password reset email sent successfully to:', email))
      .catch(emailError => console.error('Error sending password reset email:', emailError));
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


