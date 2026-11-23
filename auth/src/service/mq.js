import amqp from 'amqplib';
const QUEUE_NAME = 'auth_queue';

export const sendToQueue = (message) => {
  try {
    amqp.connect(process.env.RABBITMQ_URI || 'amqp://localhost')
      .then((connection) => {
        return connection.createChannel().then((ch1) => {
          ch1.assertQueue(QUEUE_NAME, { durable: true });
          ch1.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)));
          setTimeout(() => connection.close(), 500);
        });
      })
      .catch((err) => {
        console.error('RabbitMQ unavailable, skipping queue:', err.message);
      });
  } catch (err) {
    console.error('RabbitMQ unavailable, skipping queue:', err.message);
  }
}
