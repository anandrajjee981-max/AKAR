import 'dotenv/config';
import app from './src/app.js';
import { startConsumer } from './src/mq.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`notification server running on port ${port}`);
    startConsumer();
});
