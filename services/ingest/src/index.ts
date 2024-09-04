import { config } from 'dotenv';
config();

import { mkdir } from 'node:fs/promises';

import EventSource from 'eventsource';
import { tmpdir } from 'node:os';
// @ts-ignore
global.EventSource = EventSource;

import { ContainerClient } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { cleanUpFiles, getSnapshots } from './snapshot.js';
import { initializeStream, startSnapshots } from './stream.js';
import { client } from './trpc.js';

const tmp = tmpdir();
const runId = randomUUID();
const FPS = 1;

export const start = () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const feedId = process.env.FEED_ID;
      if (!feedId) throw new Error('FEED_ID is not set');

      const directory = `${tmp}/pending/${feedId}`;
      await mkdir(directory, { recursive: true });
      console.log(`Starting session ${feedId}`);
      console.log(`Directory: ${directory}`);

      const [streamUrl, cleanup] = await initializeStream();
      try {
        await startSnapshots(directory, streamUrl, FPS, runId);
        console.log('Subscribing to requests');

        client.feed.subscribeToRequestsForFeed.subscribe(
          { feedId },
          {
            onData: async ({ request, meta }) => {
              const from = new Date(request.startCaptureAt);
              const to = new Date(request.endCaptureAt);
              console.log(`Capturing from ${from} to ${to}`);
              console.log(
                await getSnapshots(new ContainerClient(meta.creds), directory, feedId, { id: request.id, from, to })
              );
              await client.feed.completeSnapshotRequest.mutate({ snapshotId: request.id });
            },
            onError: err => {
              console.error(err);
              reject(err);
            },
            onComplete: () => {
              console.log('complete');
              resolve();
            },
            onStarted: () => console.log('started')
          }
        );

        await cleanUpFiles(directory);
        setInterval(() => cleanUpFiles(directory), 1000 * 30);

        const onShutdown = async () => {
          console.log('SIGTERM received. Cleaning up.');
          await cleanup();
          console.log('SIGTERM complete.');
          process.exit(0);
        };

        process.on('SIGTERM', onShutdown);
        process.on('SIGINT', onShutdown);
      } catch (error) {
        await cleanup();
        console.error(error);
        process.exit(1);
      }
    } catch (error) {
      reject(error);
    }
  });
};

start()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => console.log('Stopping the server.'));
