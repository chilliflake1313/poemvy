require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: '"Poemvy" <no-reply@poemvy.dev>',
    to,
    subject,
    html,
  });
};

// Test the email
(async () => {
  try {
    console.log('📧 Sending test email...');
    console.log('Config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'
    });

    await sendEmail(
      "test@example.com",
      "Test Email",
      "<h1>Email working</h1>"
    );

    console.log('✅ Email sent successfully!');
    console.log('📬 Check your Mailtrap inbox at: https://mailtrap.io/inboxes');
    process.exit(0);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
})();
