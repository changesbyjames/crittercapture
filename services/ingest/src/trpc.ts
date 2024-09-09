import type { AppRouter } from '@critter/api/src';
import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';

export const initialise = (feedId: string, feedKey: string, apiUrl: string) => {
  const headers = {
    Authorization: `Basic ${Buffer.from(`${feedId}:${feedKey}`).toString('base64')}`
  };

  const client = createTRPCClient<AppRouter>({
    links: [
      splitLink({
        // uses the httpSubscriptionLink for subscriptions
        condition: op => op.type === 'subscription',
        true: unstable_httpSubscriptionLink({
          url: apiUrl,
          eventSourceOptions: async () => {
            return { headers };
          }
        }),
        false: httpBatchLink({
          url: apiUrl,
          headers
        })
      })
    ]
  });

  return client;
};
