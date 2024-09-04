import z from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { addImagesToSnapshot, completeSnapshotRequest, getSnapshot } from '../services/snapshot/index.js';
import { getCreateOnlySasURL } from '../services/snapshot/storage.js';
import { integrationProcedure, router } from '../trpc/trpc.js';

export default router({
  subscribeToRequestsForFeed: integrationProcedure
    .input(z.object({ feedId: z.string() }))
    .subscription(async function* ({ input }) {
      for await (const change of subscribeToChanges({ table: 'snapshots', events: ['insert'] })) {
        const request = await getSnapshot(change.id);
        if (request.feedId !== input.feedId || request.status !== 'pending') break;

        const creds = await getCreateOnlySasURL();
        yield { request, meta: { creds } };
      }
    }),

  addImagesToSnapshot: integrationProcedure
    .input(z.object({ snapshotId: z.number(), images: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await addImagesToSnapshot(input.snapshotId, input.images);
    }),

  completeSnapshotRequest: integrationProcedure
    .input(z.object({ snapshotId: z.number() }))
    .mutation(async ({ input }) => {
      await completeSnapshotRequest(input.snapshotId);
    })
});
