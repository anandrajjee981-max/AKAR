import Redis from 'ioredis';
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

export const refreshSandboxTTL = async (sandboxid) => {
    
        const result = await redis.expire(`sandbox:${sandboxid}`, 3600); // Set TTL to 1 hour

}



