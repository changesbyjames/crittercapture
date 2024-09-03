import { isBefore, subMinutes } from 'date-fns';
import { readdir, rm, stat } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

import { ContainerClient } from '@azure/storage-blob';
import { client } from './trpc.js';

const url = 'https://crittercapture.blob.core.windows.net/snapshots';
const sas = '';
const containerClient = new ContainerClient(`${url}?${sas}`);

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

export const cleanUpFiles = async (directory: string) => {
  const toCleanUp = await getSnapshotsFromDateRange(directory, new Date(0), subMinutes(new Date(), 1));
  console.log(`Cleaning up ${toCleanUp.length} files`);
  await Promise.all(toCleanUp.map(file => rm(`${directory}/${file}`)));
  console.log('Cleaned up');
};

export const uploadFile = async (feedId: string, snapshotId: number, directory: string, file: string) => {
  const id = `${feedId}/${snapshotId}-${file}`;
  const blobClient = containerClient.getBlockBlobClient(id);
  await blobClient.uploadFile(`${directory}/${file}`);
  return `${url}/${id}`;
};

const TargetUploadRate = 1000 * 0.5;
export const getSnapshots = (directory: string, feedId: string, request: { id: number; from: Date; to: Date }) => {
  return new Promise<Date>(async (resolve, reject) => {
    const alreadyUploaded = new Set<string>();

    try {
      while (isBefore(new Date(), request.to)) {
        let start = new Date();
        const snapshots = await getSnapshotsFromDateRange(directory, request.from, request.to);
        const toUpload = snapshots.filter(snapshot => !alreadyUploaded.has(snapshot));
        toUpload.forEach(snapshot => alreadyUploaded.add(snapshot));

        const uploadedImages = await Promise.all(toUpload.map(file => uploadFile(feedId, request.id, directory, file)));
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
