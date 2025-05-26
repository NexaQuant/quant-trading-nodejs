import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  BINANCE_API_KEY: z.string().min(1, 'Binance API key is required'),
  BINANCE_API_SECRET: z.string().min(1, 'Binance API secret is required'),
  WS_BASE_URL: z.string().url().default('wss://stream.binance.com:9443/ws'),
  API_BASE_URL: z.string().url().default('https://api.binance.com'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables.');
}

export const config = parsedEnv.data;