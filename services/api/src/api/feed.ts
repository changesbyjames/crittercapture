import z from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import {
  addImagesToSnapshot,
  completeSnapshotRequest,
  createSnapshotRequest,
  getSnapshot
} from '../services/snapshot/index.js';
import { integrationProcedure, procedure, router } from '../trpc/trpc.js';

export default router({
  subscribeToRequestsForFeed: integrationProcedure
    .input(z.object({ feedId: z.string() }))
    .subscription(async function* ({ ctx, input }) {
      for await (const change of subscribeToChanges({ table: 'snapshots', events: ['insert'] })) {
        const request = await getSnapshot(change.id);
        if (request.feedId !== input.feedId || request.status !== 'pending') break;
        yield request;
      }
    }),

  createSnapshotRequest: procedure
    .input(z.object({ feedId: z.string(), username: z.string(), duration: z.number(), rewind: z.number() }))
    .mutation(async ({ input }) => {
      return createSnapshotRequest(input.feedId, input.username, input.duration, input.rewind);
    }),

  addImagesToSnapshot: procedure
    .input(z.object({ snapshotId: z.number(), images: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await addImagesToSnapshot(input.snapshotId, input.images);
    }),

  completeSnapshotRequest: procedure.input(z.object({ snapshotId: z.number() })).mutation(async ({ ctx, input }) => {
    await completeSnapshotRequest(input.snapshotId);
  })
});
