import { eq } from 'drizzle-orm';
import z from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { snapshots } from '../db/schema/index.js';
import { procedure, router } from '../trpc/trpc.js';

export default router({
  snapshot: procedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [snapshot] = await ctx.db.select().from(snapshots).where(eq(snapshots.id, input.id));
    return snapshot;
  }),

  live: {
    snapshot: procedure.input(z.object({ id: z.number() })).subscription(async function* ({ ctx, input }) {
      const [snapshot] = await ctx.db.select().from(snapshots).where(eq(snapshots.id, input.id));
      if (snapshot.status === 'complete') return;

      for await (const change of subscribeToChanges({ table: 'snapshots', events: ['update'], id: input.id })) {
        const [snapshot] = await ctx.db.select().from(snapshots).where(eq(snapshots.id, input.id));
        yield snapshot;

        if (snapshot.status === 'complete') return;
      }
    })
  }
});
