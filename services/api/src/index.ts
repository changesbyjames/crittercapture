import { config } from 'dotenv';
config();

import cors from '@fastify/cors';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import router from './api/index.js';
import { start } from './services/chat/index.js';
import { createContext } from './trpc/context.js';

import authRouter from './services/auth/router.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

import { createEnvironment, withEnvironment } from './utils/env/env.js';

(async () => {
  try {
    const environment = await createEnvironment();
    await withEnvironment(environment, async () => {
      const options = { maxParamLength: 5000, http2: environment.variables.NODE_ENV === 'production' };
      const server = fastify(options);
      await server.register(cors);
      await server.register(authRouter);

      await server.register(fastifyTRPCPlugin, {
        trpcOptions: {
          router,
          createContext,
          onError() {}
        } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions']
      });
      server.listen({ port: Number(process.env.PORT), host: process.env.HOST }, async (err, address) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log(`Server listening on ${address}`);

        await start();
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
