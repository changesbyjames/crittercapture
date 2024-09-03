import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createSignInRequest, exchangeCodeForToken, restoreToken, saveToken } from './auth.js';

const TwitchRedirectResponse = z.object({
  code: z.string(),
  scope: z.string()
});

export default async function register(router: FastifyInstance) {
  router.get('/auth/signin', async (request, reply) => {
    const url = createSignInRequest('/auth/redirect', crypto.randomUUID());
    return reply.redirect(url);
  });

  router.get('/auth/redirect', async (request, reply) => {
    const query = TwitchRedirectResponse.parse(request.query);
    const token = await exchangeCodeForToken(query.code);
    await saveToken(token);
    return reply.send(`Thank you for signing in!`);
  });

  router.get('/auth/status', async (request, reply) => {
    const token = await restoreToken();
    return reply.send(token);
  });
}
