import { config } from 'dotenv';
config();

import { mkdir } from 'node:fs/promises';

import EventSource from 'eventsource';
// @ts-ignore
global.EventSource = EventSource;

import { randomUUID } from 'node:crypto';
import { cleanUpFiles, connectToFeed, healthCheck } from './snapshot.js';
import { initialize, startSnapshots } from './stream.js';
import { createEnvironment, useEnvironment, withEnvironment } from './utils/env/env.js';
import { CustomError, dispose } from './utils/errors.js';

const runId = randomUUID();
const FPS = 1;

export const start = async () => {
  const { variables } = useEnvironment();
  const feedId = variables.FEED_ID;
  const dataDir = variables.DATA_DIR;
  const directory = `${dataDir}/pending/${feedId}`;
  await mkdir(directory, { recursive: true });
  console.log(`Starting session ${feedId}`);
  console.log(`Directory: ${directory}`);

  const stream = await initialize();
  const ff = await startSnapshots(directory, stream.url, FPS, runId);
  console.log('Subscribing to requests');

  try {
    const connection = await connectToFeed(feedId, directory);

    const onShutdown = async () => {
      console.log('SIGTERM received. Cleaning up.');
      await dispose(connection);
      await dispose(ff);
      await dispose(stream);
      console.log('SIGTERM complete.');
      process.exit(0);
    };

    console.log('Listening for SIGTERM and SIGINT');
    process.on('SIGTERM', onShutdown);
    process.on('SIGINT', onShutdown);

    const LIFETIME = 1000 * 60;
    setInterval(async () => {
      await cleanUpFiles(directory, LIFETIME);
      await healthCheck(directory);
    }, LIFETIME / 2);
  } catch (error) {
    if (error instanceof CustomError) {
      console.warn(error.toString());
    } else {
      console.error(error);
    }
    await dispose(ff);
    await dispose(stream);
    process.exit(1);
  }
};

const environment = await createEnvironment();
await withEnvironment(environment, start);
