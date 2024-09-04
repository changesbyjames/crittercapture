import { z } from 'zod';
import { createCapture, getCapture } from '../services/capture/index.js';
import { editorProcedure, procedure, router } from '../trpc/trpc.js';

export default router({
  capture: procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getCapture(input.id);
  }),
  snapshotToCapture: editorProcedure
    .input(z.object({ snapshotId: z.number(), name: z.string().optional(), images: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return createCapture(input.snapshotId, input.images, input.name);
    })
});
