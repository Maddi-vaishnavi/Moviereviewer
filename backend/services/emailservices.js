const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendWelcomeEmail(userEmail, userName, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: {
        name: 'Movie Reviewer App',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Welcome to Movie Reviewer App - Please Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Welcome to Movie Reviewer App!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>Thank you for joining our movie reviewer community! We're excited to have you on board.</p>
              
              <p>To get started and access all features, please verify your email address by clicking the button below:</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Start reviewing your favorite movies</li>
                <li>Discover new films through community recommendations</li>
                <li>Build your personalized movie watchlist</li>
                <li>Connect with fellow movie enthusiasts</li>
              </ul>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <p>Happy reviewing!<br>The Movie Reviewer Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by Movie Reviewer App. If you have any questions, contact us at support@moviereviewer.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Movie Reviewer App',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Password Reset Request - Movie Reviewer App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>We received a request to reset your password for your Movie Reviewer App account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will remain unchanged unless you click the link above</li>
                </ul>
              </div>
              
              <p>If you continue to have problems, please contact our support team.</p>
              
              <p>Best regards,<br>The Movie Reviewer Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by Movie Reviewer App. If you have any questions, contact us at support@moviereviewer.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmailVerificationSuccess(userEmail, userName) {
    const mailOptions = {
      from: {
        name: 'Movie Reviewer App',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Email Successfully Verified - Movie Reviewer App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Verified Successfully!</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${userName}!</h2>
              <p>Your email has been successfully verified. You now have full access to all Movie Reviewer App features.</p>
              
              <p><strong>You can now:</strong></p>
              <ul>
                <li>Write and publish movie reviews</li>
                <li>Rate movies and build your watchlist</li>
                <li>Follow other reviewers</li>
                <li>Receive personalized movie recommendations</li>
                <li>Participate in community discussions</li>
              </ul>
              
              <p>Start exploring and sharing your movie opinions with our community!</p>
              
              <p>Happy reviewing!<br>The Movie Reviewer Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by Movie Reviewer App. If you have any questions, contact us at support@moviereviewer.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email verification success email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification success email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();