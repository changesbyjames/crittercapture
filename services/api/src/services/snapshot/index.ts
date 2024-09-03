import { addSeconds, subSeconds } from 'date-fns';
import { eq } from 'drizzle-orm';
import { snapshots } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export const createSnapshotRequest = async (feedId: string, username: string, duration: number, rewind: number) => {
  const { db } = useEnvironment();
  const startCaptureAt = subSeconds(new Date(), rewind);
  const endCaptureAt = addSeconds(startCaptureAt, duration);
  const [request] = await db
    .insert(snapshots)
    .values({
      feedId,
      createdAt: new Date(),
      createdBy: username,
      startCaptureAt,
      endCaptureAt
    })
    .returning();
  return request;
};

export const getSnapshot = async (id: number) => {
  const { db } = useEnvironment();
  const [request] = await db.select().from(snapshots).where(eq(snapshots.id, id));
  return request;
};

export const addImagesToSnapshot = async (id: number, images: string[]) => {
  const { db } = useEnvironment();
  const request = await getSnapshot(id);
  await db
    .update(snapshots)
    .set({ images: [...request.images, ...images], status: 'processing' })
    .where(eq(snapshots.id, id));
};

export const completeSnapshotRequest = async (id: number) => {
  const { db } = useEnvironment();
  await db.update(snapshots).set({ status: 'complete' }).where(eq(snapshots.id, id));
};
