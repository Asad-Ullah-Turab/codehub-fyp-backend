import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize email transporter
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if email credentials are provided
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email service not configured - missing credentials');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify the connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.initialized && this.transporter !== null;
  }

  // Generate OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email for verification
  async sendVerificationOTP(email, otp, name = 'User') {
    if (!this.isAvailable()) {
      throw new Error('Email service is not available');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CodeHub'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - CodeHub',
      html: this.getVerificationEmailTemplate(name, otp),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordResetOTP(email, otp, name = 'User') {
    if (!this.isAvailable()) {
      throw new Error('Email service is not available');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CodeHub'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - CodeHub',
      html: this.getPasswordResetEmailTemplate(name, otp),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Email verification template
  getVerificationEmailTemplate(name, otp) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .otp-box { background-color: #456DE6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .btn { background-color: #456DE6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CodeHub</div>
          <h2>Verify Your Email Address</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>Thank you for signing up for CodeHub! To complete your registration, please verify your email address using the OTP code below:</p>
        
        <div class="otp-box">
          <div>Your verification code is:</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 14px; margin-top: 10px;">This code will expire in 15 minutes</div>
        </div>
        
        <p>If you didn't create a CodeHub account, you can safely ignore this email.</p>
        
        <div class="footer">
          <p><strong>CodeHub Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Password reset email template
  getPasswordResetEmailTemplate(name, otp) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .otp-box { background-color: #e74c3c; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CodeHub</div>
          <h2>Reset Your Password</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your CodeHub account. Use the verification code below to proceed:</p>
        
        <div class="otp-box">
          <div>Your password reset code is:</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 14px; margin-top: 10px;">This code will expire in 15 minutes</div>
        </div>
        
        <div class="warning">
          <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and consider changing your password for security.
        </div>
        
        <div class="footer">
          <p><strong>CodeHub Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;