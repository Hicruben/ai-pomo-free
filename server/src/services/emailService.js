/**
 * Email Service
 *
 * This service handles sending emails using Nodemailer.
 * Configure your SMTP settings in .env file for production use.
 */

const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body (optional)
 * @param {string} options.from - Sender email (optional, defaults to env variable)
 * @returns {Promise} - Resolves with info about the sent email or rejects with error
 */
const sendEmail = async (options) => {
  try {
    // Log the email for debugging
    console.log('Sending email with options:', options);
    console.log('Email environment variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
    console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Check if email is enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email is disabled by configuration. Set EMAIL_ENABLED=true to enable.');
      return {
        messageId: `disabled-${Date.now()}`,
        response: 'Email sending is disabled by configuration',
      };
    }

    if (isDevelopment && !process.env.EMAIL_HOST) {
      // In development without SMTP config, just log the email
      console.log('Development mode: Email would be sent with the following content:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text);

      // Return a mock success response
      return {
        messageId: `mock-${Date.now()}`,
        response: 'Mock email sent successfully (development mode)',
      };
    }

    // Create a transporter using SMTP with TLS
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // TLS configuration
      requireTLS: process.env.EMAIL_REQUIRE_TLS === 'true',
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
        // Explicitly set the min TLS version
        minVersion: 'TLSv1.2'
      },
      debug: true // Enable debug output
    });

    // Set default sender if not provided
    const from = options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;

    // Send the email
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      replyTo: options.replyTo,
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a contact form email to the site owner
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender's name
 * @param {string} data.email - Sender's email
 * @param {string} data.message - Message content
 * @param {string} data.subject - Email subject
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendContactFormEmail = async (data) => {
  const { name, email, message, subject } = data;

  // Validate required fields
  if (!name || !email || !message) {
    throw new Error('Name, email, and message are required');
  }

  // Create email content
  const emailSubject = subject || 'New Contact Form Submission';
  const text = `
    Name: ${name}
    Email: ${email}

    Message:
    ${message}
  `;

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <h3>Message:</h3>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  // Send the email to the site owner
  return sendEmail({
    to: process.env.CONTACT_EMAIL || 'your_contact_email@example.com', // Ensure CONTACT_EMAIL is set in your .env
    subject: emailSubject,
    text,
    html,
    // Reply-To header set to the sender's email
    replyTo: email,
  });
};

/**
 * Send a welcome onboarding email to a newly registered user
 * @param {Object} data - User data
 * @param {string} data.name - User's name
 * @param {string} data.email - User's email
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendWelcomeEmail = async (data) => {
  const { name, email } = data;

  // Validate required fields
  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  // Create email content
  const subject = 'Welcome Aboard AI Pomo - Your AI-Powered Productivity Partner!';
  const text = `
    Hi ${name},

    Welcome to AI Pomo! We're thrilled to have you join a platform designed to significantly enhance your productivity and focus.

    We built AI Pomo around some powerful core ideas to help you achieve your goals more effectively:

    AI-Powered Project Structuring: Say goodbye to hours of planning! Simply describe your project goals, and our AI will generate a complete, structured plan with tasks, milestones, and notes, giving you a massive head start. This is a real game-changer for turning your ideas into actionable plans.

    Integrated Task & Project Management with Pomodoro: AI Pomo seamlessly blends the proven Pomodoro Technique with robust task and project management. This means you can not only apply focused work sessions but also see exactly how that focused effort contributes to your larger projects and goals, keeping everything connected and on track.

    Clear Progress Visualization & Tracking: Stay motivated and informed with tangible measures of your effort and achievement. Our features like Pomodoro counters per project, calendar integration showing deadlines and completed focus sessions, and detailed statistics dashboards provide clear visibility into your productivity journey.

    We believe these features will make a real difference in how you approach your work and projects.

    Ready to experience AI-powered productivity? Log in to your account here: ${process.env.CLIENT_URL}/login

    If you have any questions as you explore AI Pomo, our support team is here to help.

    To your success,
    The AI Pomo Team
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AI Pomo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f7f7f7; line-height: 1.6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%); padding: 30px 40px; text-align: center;">
                  <div style="font-size: 40px; margin-bottom: 10px;">🍅</div>
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to AI Pomo!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="font-size: 16px; margin-top: 0; margin-bottom: 20px;">Hi ${name},</p>

                  <p style="font-size: 16px; margin-bottom: 20px;">Welcome to AI Pomo! We're thrilled to have you join a platform designed to significantly enhance your productivity and focus.</p>

                  <p style="font-size: 16px; margin-bottom: 25px;">We built AI Pomo around some powerful core ideas to help you achieve your goals more effectively:</p>

                  <!-- Feature 1 -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 25px;">
                    <tr>
                      <td width="60" valign="top">
                        <div style="width: 50px; height: 50px; background-color: rgba(217, 85, 80, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 50px; font-weight: bold; color: #d95550; font-size: 20px;">1</div>
                      </td>
                      <td>
                        <h3 style="color: #d95550; margin-top: 0; margin-bottom: 10px; font-size: 18px;">AI-Powered Project Structuring</h3>
                        <p style="margin: 0; color: #555; font-size: 15px;">Say goodbye to hours of planning! Simply describe your project goals, and our AI will generate a complete, structured plan with tasks, milestones, and notes, giving you a massive head start.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Feature 2 -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 25px;">
                    <tr>
                      <td width="60" valign="top">
                        <div style="width: 50px; height: 50px; background-color: rgba(217, 85, 80, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 50px; font-weight: bold; color: #d95550; font-size: 20px;">2</div>
                      </td>
                      <td>
                        <h3 style="color: #d95550; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Integrated Task & Project Management</h3>
                        <p style="margin: 0; color: #555; font-size: 15px;">AI Pomo seamlessly blends the proven Pomodoro Technique with robust task and project management, keeping everything connected and on track.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Feature 3 -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td width="60" valign="top">
                        <div style="width: 50px; height: 50px; background-color: rgba(217, 85, 80, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 50px; font-weight: bold; color: #d95550; font-size: 20px;">3</div>
                      </td>
                      <td>
                        <h3 style="color: #d95550; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Clear Progress Visualization & Tracking</h3>
                        <p style="margin: 0; color: #555; font-size: 15px;">Stay motivated with tangible measures of your effort and achievement through Pomodoro counters, calendar integration, and detailed statistics dashboards.</p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; margin-bottom: 30px;">We believe these features will make a real difference in how you approach your work and projects.</p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #d95550 0%, #eb6b56 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">Log In to Your Account</a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; margin-bottom: 25px;">If you have any questions as you explore AI Pomo, our support team is here to help.</p>

                  <p style="font-size: 16px; margin-bottom: 0;">To your success,<br><strong>The AI Pomo Team</strong></p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #888; font-size: 13px;">© ${new Date().getFullYear()} AI Pomo. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Send the welcome email
  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendContactFormEmail,
  sendWelcomeEmail,
};
