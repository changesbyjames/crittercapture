import { eq } from 'drizzle-orm';
import { roles } from '../db/schema/index.js';
import { procedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  permissions: procedure.query(async ({ ctx }) => {
    const user = useUser();
    console.log(user);
    const [role] = await ctx.db.select().from(roles).where(eq(roles.username, user.id));

    const permissions = {
      editor: false,
      moderator: false,
      administrate: false
    };

    if (!role) return permissions;

    if (role.role === 'admin') {
      permissions.editor = true;
      permissions.moderator = true;
      permissions.administrate = true;

      return permissions;
    }

    if (role.role === 'mod') {
      permissions.editor = true;
      permissions.moderator = true;
      return permissions;
    }

    if (role.role === 'user') {
      permissions.editor = true;
      return permissions;
    }
  })
});
