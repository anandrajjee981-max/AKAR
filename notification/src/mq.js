import 'dotenv/config';
import amqplib from 'amqplib';
import sendEmail from './email.js';

const QUEUE = 'auth_queue';

export async function startConsumer() {
  const uri = process.env.RABBITMQ_URI || process.env.RABBITMQ_URL;
  if (!uri) {
    console.error('❌ RABBITMQ_URI is not set in environment!');
    return;
  }

  try {
    const connection = await amqplib.connect(uri);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`✅ Connected to RabbitMQ, consumer listening on "${QUEUE}"`);

    channel.consume(QUEUE, async (msg) => {
      if (msg !== null) {
        const rawMessage = msg.content.toString();
        console.log('📨 Message received successfully:', rawMessage);
        try {
          const data = JSON.parse(rawMessage);
          let email = data.email || data.emails?.[0]?.value;
          let name = data.name;

          // If email is missing at top-level, extract from JWT token if available
          if (!email && data.token && typeof data.token === 'string') {
            try {
              const parts = data.token.split('.');
              if (parts.length >= 2) {
                const tokenPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
                if (tokenPayload.email) email = tokenPayload.email;
                if (!name && tokenPayload.name) name = tokenPayload.name;
              }
            } catch (jwtErr) {
              console.warn('Could not extract email from token:', jwtErr.message);
            }
          }

          if (typeof name === 'object' && name !== null) {
            name = [name.givenName, name.familyName].filter(Boolean).join(' ') || email;
          }
          if (!name) name = 'User';

          if (!email) {
            console.warn('⚠️ No email found in payload or token, acknowledging message.');
            channel.ack(msg);
            return;
          }

          const subject = 'New login detected';
          const text = `Hi ${name}, a new login was detected for your account.`;
          const html = `<p>Hi <strong>${name}</strong>,</p><p>A new login was detected for your account. If this was not you, please secure your account immediately.</p>`;

          await sendEmail(email, subject, text, html);
          channel.ack(msg);
          console.log(`✅ Email sent and message acknowledged for ${email}`);
        } catch (err) {
          console.error('❌ Error processing notification:', err.message);
          // Don't ack so message can be re-tried or inspect error
        }
      }
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed. Reconnecting in 5 seconds...');
      setTimeout(startConsumer, 5000);
    });

    return channel;
  } catch (err) {
    console.error('❌ RabbitMQ unavailable, notification consumer disabled:', err.message);
    console.log('Retrying RabbitMQ connection in 5 seconds...');
    setTimeout(startConsumer, 5000);
  }
}

