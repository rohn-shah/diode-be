const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Create a new user and send set password email
 */
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Create user
    const user = new User(userData);

    // Generate email verification token (expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 86400000; // 24 hours

    await user.save();

    // Send set password email
    try {
      await emailService.sendSetPasswordEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Error sending set password email:', emailError);
      // Don't fail the user creation if email fails
      // Admin can resend the email later
    }

    // Return created user (populate companyId for consistency with React Admin)
    const populatedUser = await User.findById(user._id).populate('companyId');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating user'
    });
  }
};
