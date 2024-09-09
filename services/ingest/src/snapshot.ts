import { isBefore, subMilliseconds } from 'date-fns';
import { readdir, rm, stat } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

import { ContainerClient } from '@azure/storage-blob';
import { useEnvironment } from './utils/env/env.js';
import { DownstreamError, handleDanglingError } from './utils/errors.js';

export const getSnapshotsFromDateRange = async (directory: string, start: Date, end: Date) => {
  const dir = await readdir(directory);
  const files = await Promise.all(
    dir.map(async file => {
      const stats = await stat(`${directory}/${file}`);
      return { ...stats, file };
    })
  );
  console.log(`Total files: ${files.length}`);
  const snapshots = files.filter(file => {
    const createdAtInMs = Math.floor(file.birthtimeMs);
    return createdAtInMs >= start.getTime() && createdAtInMs <= end.getTime();
  });
  console.log(`Total snapshots: ${snapshots.length}`);
  return snapshots.map(snapshot => snapshot.file);
};

export const cleanUpFiles = async (directory: string, lifetime: number) => {
  const toCleanUp = await getSnapshotsFromDateRange(directory, new Date(0), subMilliseconds(new Date(), lifetime));
  console.log(`Cleaning up ${toCleanUp.length} files`);
  await Promise.all(toCleanUp.map(file => rm(`${directory}/${file}`)));
  console.log('Cleaned up');
};

export const uploadFile = async (
  client: ContainerClient,
  feedId: string,
  snapshotId: number,
  directory: string,
  file: string
) => {
  const id = `${feedId}/${snapshotId}-${file}`;
  const blobClient = client.getBlockBlobClient(id);
  await blobClient.uploadFile(`${directory}/${file}`);
  return `https://${client.accountName}.blob.core.windows.net/${client.containerName}/${id}`;
};

const TargetUploadRate = 1000 * 0.5;
export const getSnapshots = (
  containerClient: ContainerClient,
  directory: string,
  feedId: string,
  request: { id: number; from: Date; to: Date }
) => {
  const { client } = useEnvironment();
  return new Promise<Date>(async (resolve, reject) => {
    const alreadyUploaded = new Set<string>();

    try {
      while (isBefore(new Date(), request.to)) {
        let start = new Date();
        const snapshots = await getSnapshotsFromDateRange(directory, request.from, request.to);
        const toUpload = snapshots.filter(snapshot => !alreadyUploaded.has(snapshot));
        toUpload.forEach(snapshot => alreadyUploaded.add(snapshot));

        const uploadedImages = await Promise.all(
          toUpload.map(file => uploadFile(containerClient, feedId, request.id, directory, file))
        );
        let end = new Date();
        const timeToSleep = Math.max(0, TargetUploadRate - (end.getTime() - start.getTime()));
        await client.feed.addImagesToSnapshot.mutate({
          snapshotId: request.id,
          images: uploadedImages
        });
        await sleep(timeToSleep);
      }

      resolve(new Date());
    } catch (error) {
      reject(error);
    }
  });
};

const state = {
  check: 0,
  lastNumberOfFiles: undefined as number | undefined
};
export const healthCheck = async (directory: string) => {
  state.check++;
  if (state.check < 3) {
    console.log(`Skipping health check (${state.check}) to give the system time to stabilize`);
    return;
  }

  console.log(`Running health check & updating metrics (${state.check})`);
  const files = await readdir(directory);

  if (state.lastNumberOfFiles === undefined) {
    console.log(`First health check. Setting last number of files to ${files.length}`);
    state.lastNumberOfFiles = files.length;
    return;
  }

  console.log(`Last number of files: ${state.lastNumberOfFiles}`);
  console.log(`Current number of files: ${files.length}`);
  const percentChange = Math.floor(Math.abs((files.length - state.lastNumberOfFiles) / state.lastNumberOfFiles) * 100);
  state.lastNumberOfFiles = files.length;
  console.log(`Percent change: ${percentChange}%`);
  if (percentChange > 10) {
    console.warn(`Health check failed. Number of files has increased by ${percentChange}%`);
  }
};

export const connectToFeed = (feedId: string, directory: string) => {
  const { client } = useEnvironment();
  return new Promise<AsyncDisposable>(async (resolve, reject) => {
    let connected = false;
    let cleaningUp = false;
    const firstConnectionAttempt = Date.now();
    const subscription = client.feed.subscribeToRequestsForFeed.subscribe(
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
        onError: err => handleDanglingError(new DownstreamError('api', err.message)),
        onComplete: () => {
          if (cleaningUp) return;
          handleDanglingError(
            new DownstreamError(
              'api',
              `Feed ended. The API could have been shutdown or there could be a connection issue.`
            )
          );
        },

        onStarted: () => {
          connected = true;
          console.log('Connected to feed');
          resolve({
            [Symbol.asyncDispose]: async () => {
              cleaningUp = true;
              console.log('Unsubscribing from requests');
              subscription.unsubscribe();
            }
          });
        }
      }
    );

    const connectionHealthCheck = setInterval(() => {
      if (!connected) {
        if (Date.now() - firstConnectionAttempt > 1000 * 10) {
          reject(
            new DownstreamError(
              'api',
              `Feed could not be connected to. The API could have been shutdown or there could be a connection issue.`
            )
          );
        }
        return;
      }

      clearInterval(connectionHealthCheck);
    }, 1000);
  });
};
