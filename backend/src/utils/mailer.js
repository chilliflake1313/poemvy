const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, you can use Mailtrap or Gmail
  // For production, use a service like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email service
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - Gmail or Mailtrap
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Use App Password for Gmail
        }
      });
    } else {
      // Default to Mailtrap for dev
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }
};

// Send OTP email
const sendOTPEmail = async (email, code, type = 'Email Verification') => {
  try {
    const transporter = createTransporter();

    const isPasswordReset = type === 'Password Reset';
    const subject = isPasswordReset ? 'Password Reset Code - Poemvy' : 'Your Poemvy Verification Code';
    const title = isPasswordReset ? 'Password Reset' : 'Email Verification';
    const message = isPasswordReset 
      ? 'You requested to reset your password. Use the code below to continue:'
      : 'Your verification code is:';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Poemvy" <noreply@poemvy.com>',
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Inter, system-ui, -apple-system, sans-serif;
                background-color: #000000;
                color: #c1d9e8;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(11, 43, 58, 0.9);
                border: 1px solid rgba(53, 118, 162, 0.15);
                border-radius: 16px;
                padding: 40px;
              }
              .logo {
                font-size: 32px;
                font-weight: 600;
                color: #e8f4fb;
                margin-bottom: 24px;
                text-align: center;
              }
              .code-container {
                background: rgba(53, 118, 162, 0.2);
                border: 1px solid rgba(53, 118, 162, 0.3);
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                margin: 24px 0;
              }
              .code {
                font-size: 36px;
                font-weight: 700;
                color: #a1d3f8;
                letter-spacing: 8px;
                margin: 0;
              }
              .message {
                color: rgba(161, 211, 248, 0.8);
                font-size: 15px;
                line-height: 1.6;
                margin: 16px 0;
              }
              .footer {
                color: rgba(110, 143, 153, 0.7);
                font-size: 13px;
                text-align: center;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid rgba(53, 118, 162, 0.15);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Poemvy</div>
              <p class="message">${message}</p>
              <div class="code-container">
                <h1 class="code">${code}</h1>
              </div>
              <p class="message">
                This code will expire in <strong>5 minutes</strong>. 
                Do not share this code with anyone.
              </p>
              <p class="message">
                If you didn't request this code, you can safely ignore this email.
              </p>
              <div class="footer">
                This is an automated message from Poemvy. Please do not reply.
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Your Poemvy ${title.toLowerCase()} code is: ${code}\n\nThis code will expire in 5 minutes.\nIf you didn't request this code, you can safely ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('OTP Email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendOTPEmail
};
