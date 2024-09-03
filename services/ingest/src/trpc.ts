import type { AppRouter } from '@critter/api/src';
import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';

const makeAPIKey = () => {
  if (!process.env.FEED_ID || !process.env.FEED_KEY) {
    throw new Error('FEED_ID and FEED_KEY must be set');
  }
  return Buffer.from(`${process.env.FEED_ID}:${process.env.FEED_KEY}`).toString('base64');
};

export const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      // uses the httpSubscriptionLink for subscriptions
      condition: op => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        url: process.env.API_URL!,
        eventSourceOptions: async () => {
          return { headers: { Authorization: `Basic ${makeAPIKey()}` } };
        }
      }),
      false: httpBatchLink({
        url: process.env.API_URL!,
        headers: async () => ({ Authorization: `Basic ${makeAPIKey()}` })
      })
    })
  ]
});
