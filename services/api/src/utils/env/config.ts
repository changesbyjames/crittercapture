import { Redis, RedisOptions } from 'ioredis';
import z from 'zod';
import { initialise } from '../../db/db.js';

export const config = z.object({
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SSL: z.coerce.boolean().default(false),
  HOST: z.string(),
  PORT: z.coerce.number(),
  POSTGRES_HOST: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SSL: z.coerce.boolean().default(false),

  UI_URL: z.string(),

  JWT_SECRET: z.string().transform(value => Buffer.from(value, 'hex')),
  NODE_ENV: z.enum(['development', 'production']).default('development')
});

export const services = async (variables: z.infer<typeof config>) => {
  const options: RedisOptions = {};
  if (variables.REDIS_PASSWORD) {
    options.password = variables.REDIS_PASSWORD;
  }
  if (variables.REDIS_SSL) {
    options.tls = { rejectUnauthorized: false };
  }

  const redis = new Redis(Number(variables.REDIS_PORT), variables.REDIS_HOST, options);
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL
  );

  return {
    redis,
    db: database.db,
    postgres: database.client
  };
};
