/**
 * Contact Controller
 *
 * Handles contact form submissions and other contact-related functionality
 */

const emailService = require('../services/emailService');

/**
 * Handle contact form submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitContactForm = async (req, res) => {
  try {
    console.log('Contact form submission received:', req.body);

    const { name, email, message, type } = req.body;

    // Validate required fields
    if (!name || !email || !message || !type) {
      console.log('Validation failed:', { name, email, message, type });
      return res.status(400).json({
        success: false,
        message: 'Name, email, message, and type are required'
      });
    }

    // Generate subject based on type
    let subject;
    switch (type) {
      case 'premium':
        subject = 'Premium Subscription Request';
        break;
      case 'feature':
        subject = 'Feature Request';
        break;
      case 'bug':
        subject = 'Bug Report';
        break;
      case 'feedback':
        subject = 'General Feedback';
        break;
      default:
        subject = 'Contact Form Submission';
    }

    // Send the email
    const emailResult = await emailService.sendContactFormEmail({
      name,
      email,
      message,
      subject
    });

    // Log the result for debugging
    console.log('Contact form email sent:', emailResult);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!',
      data: { messageId: emailResult.messageId }
    });
  } catch (error) {
    console.error('Error in contact form submission:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again later.',
      error: error.message
    });
  }
};

module.exports = {
  submitContactForm
};
