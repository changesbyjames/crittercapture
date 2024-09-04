import { eq } from 'drizzle-orm';
import { captures, images, snapshots } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export const createCapture = async (snapshotId: number, imagesToKeep: string[], name?: string) => {
  const { db } = useEnvironment();
  const snapshot = await db.query.snapshots.findFirst({
    where: eq(snapshots.id, snapshotId)
  });
  if (!snapshot) throw new Error('Snapshot not found');

  return await db.transaction(async tx => {
    const [capture] = await tx
      .insert(captures)
      .values({
        createdAt: snapshot.createdAt,
        createdBy: snapshot.createdBy,
        name
      })
      .returning();

    await tx.insert(images).values(imagesToKeep.map(image => ({ url: image, captureId: capture.id })));
    await tx.update(snapshots).set({ captureId: capture.id }).where(eq(snapshots.id, snapshotId));

    return capture;
  });
};

export const getCapture = async (id: number) => {
  const { db } = useEnvironment();
  const capture = await db.query.captures.findFirst({
    where: eq(captures.id, id),
    with: {
      images: true
    }
  });
  if (!capture) throw new Error('Capture not found');
  return capture;
};
