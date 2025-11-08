const nodemailer = require('nodemailer');

/**
 * Email Service with swappable provider pattern
 * Supports: Gmail, SendGrid, AWS SES, Mailgun, etc.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.provider = process.env.EMAIL_PROVIDER || 'gmail';
    this.initializeTransporter();
  }

  initializeTransporter() {
    switch (this.provider.toLowerCase()) {
      case 'gmail':
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD // App Password, not regular password
          }
        });
        break;

      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
        break;

      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        break;

      case 'ses':
        // AWS SES configuration
        const aws = require('@aws-sdk/client-ses');
        const { defaultProvider } = require('@aws-sdk/credential-provider-node');
        const ses = new aws.SES({
          apiVersion: '2010-12-01',
          region: process.env.AWS_REGION || 'us-east-1',
          credentialDefaultProvider: defaultProvider()
        });
        this.transporter = nodemailer.createTransport({
          SES: { ses, aws }
        });
        break;

      default:
        console.warn(`Unknown email provider: ${this.provider}. Falling back to Gmail.`);
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendSetPasswordEmail(user, token) {
    const setPasswordUrl = `${process.env.APP_URL}/set-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to Diode!</h2>
            <p>Hello ${user.firstName} ${user.lastName},</p>
            <p>Your account has been created. Please set your password to access your account.</p>
            <a href="${setPasswordUrl}" class="button">Set Your Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${setPasswordUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you did not request this, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Diode. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Diode!

      Hello ${user.firstName} ${user.lastName},

      Your account has been created. Please set your password to access your account.

      Set your password by visiting: ${setPasswordUrl}

      This link will expire in 24 hours.

      If you did not request this, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Set Your Password - Diode',
      html,
      text
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetPasswordUrl = `${process.env.APP_URL}/reset-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.firstName} ${user.lastName},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <a href="${resetPasswordUrl}" class="button">Reset Your Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetPasswordUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="footer">
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>&copy; ${new Date().getFullYear()} Diode. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request

      Hello ${user.firstName} ${user.lastName},

      You requested to reset your password. Reset it by visiting: ${resetPasswordUrl}

      This link will expire in 1 hour.

      If you did not request a password reset, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Diode',
      html,
      text
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
