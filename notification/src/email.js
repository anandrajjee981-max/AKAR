import 'dotenv/config';
import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error connecting to email server:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  }
  return transporter;
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const client = getTransporter();
    const info = await client.sendMail({
      from: `"Security Alert" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('✉️ Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

export default sendEmail;

