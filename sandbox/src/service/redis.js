import 'dotenv/config';
import Redis from 'ioredis';
import { deleteservice } from '../kubernetes/service.js';
import { deletePod } from '../kubernetes/pod.js';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    connectTimeout: 5000,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            return null; // stop reconnecting
        }
        return Math.min(times * 200, 2000);
    }
};

const redis = new Redis(redisConfig);
redis.on('error', (err) => console.error('Redis client error:', err.message));

const Subscriber = new Redis(redisConfig);
Subscriber.on('error', (err) => console.error('Redis subscriber error:', err.message));

export const createSandboxTTL = async (sandboxid) => {
    await redis.set(`sandbox:${sandboxid}`, 'active', 'EX', 3600);
};

Subscriber.config('SET', 'notify-keyspace-events', 'Ex').catch((err) => console.error('Redis config error:', err.message));
Subscriber.subscribe('__keyevent@0__:expired').catch((err) => console.error('Redis subscribe error:', err.message));
Subscriber.on('message', (channel, key) => {
    if (key.startsWith('sandbox:')) {
        const sandboxid = key.split(':')[1];
        console.log(`Sandbox ${sandboxid} has expired. Deleting associated resources...`);
        deletePod(sandboxid);
        deleteservice(sandboxid);
    }
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err?.message || err);
});

export { Subscriber, redis };

