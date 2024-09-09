import { tmpdir } from 'node:os';
import z from 'zod';
import { initialise } from '../../trpc.js';

export const config = z.object({
  STREAM_URL: z.string(),
  FEED_ID: z.string(),
  FEED_KEY: z.string(),
  API_URL: z.string(),
  TWITCH_API_TOKEN: z.string().optional(),
  DATA_DIR: z.string().default(tmpdir())
});

export const services = async (variables: z.infer<typeof config>) => {
  const client = initialise(variables.FEED_ID, variables.FEED_KEY, variables.API_URL);
  return { client };
};
