import { z } from 'zod';
import { createCapture, getCapture } from '../services/capture/index.js';
import { editorProcedure, procedure, router } from '../trpc/trpc.js';

export default router({
  capture: procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getCapture(input.id);
  }),
  snapshotToCapture: editorProcedure
    .input(
      z.object({
        snapshotId: z.number(),
        name: z.string().optional(),
        images: z.array(
          z.object({
            url: z.string(),
            boundingBoxes: z.array(
              z.object({
                id: z.string(),
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number()
              })
            )
          })
        )
      })
    )
    .mutation(async ({ input }) => {
      return createCapture(input);
    })
});
