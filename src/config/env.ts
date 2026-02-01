import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    database: {
        url: process.env.DATABASE_URL,
    },
    jwtSecret: process.env.JWT_SECRET || 'secret',
    redis: {
        host: process.env.REDIS_HOST || 'redis-12703.fcrce261.ap-seast-1-1.ec2.cloud.redislabs.com',
        port: parseInt(process.env.REDIS_PORT || '12703'),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD || 'P38Ylt1ZeD10NKoXJK3KEXJkVdeqSE73',
        keyPrefix: process.env.REDIS_PREFIX || 'hr:',
    },
    email: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.SMTP_FROM || 'noreply@peoplehub.com',
        fromName: process.env.SMTP_FROM_NAME || 'PeopleHub',
    },
    app: {
        name: process.env.APP_NAME || 'PeopleHub',
        url: process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
    },
};
