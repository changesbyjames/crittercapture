import { initTRPC } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { validateJWT } from 'oslo/jwt';
import { feeds } from '../db/schema/index.js';
import { withUser } from '../utils/env/env.js';
import { createContext } from './context.js';

const t = initTRPC.context<typeof createContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;

export const procedure = t.procedure.use(async ({ ctx, next }) => {
  const headers = ctx.req.headers;
  const authorization = headers.authorization;
  if (!authorization) {
    throw new Error('Unauthorized');
  }
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer') {
    throw new Error('Unauthorized');
  }

  const decoded = await validateJWT('HS256', ctx.variables.JWT_SECRET, token);
  if (!decoded.subject) throw new Error('Unauthorized');
  return withUser({ id: decoded.subject }, next);
});

export const integrationProcedure = t.procedure.use(async ({ ctx, next }) => {
  const headers = ctx.req.headers;
  const authorization = headers.authorization;
  if (!authorization) {
    throw new Error('Unauthorized');
  }
  const [type, token] = authorization.split(' ');
  if (type !== 'Basic') {
    throw new Error('Unauthorized');
  }

  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');
  const [feed] = await ctx.db.select().from(feeds).where(eq(feeds.id, username));
  if (!feed || feed.key !== password) {
    throw new Error('Unauthorized');
  }
  return next();
});
