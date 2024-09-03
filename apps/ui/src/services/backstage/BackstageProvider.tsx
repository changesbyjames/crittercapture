import { Backstage, ProviderConfiguration } from '@critter/backstage';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC, PropsWithChildren } from 'react';
import { config, url } from './local';

export const BackstageProvider: FC<PropsWithChildren> = ({ children }) => {
  const providers = useSuspenseQuery<ProviderConfiguration[]>({
    queryKey: ['backstage-providers'],
    queryFn: async () => {
      const providers: ProviderConfiguration[] = [];
      if (import.meta.env.DEV) {
        providers.push({
          priority: 1,
          config
        });

        if (url) {
          const response = await fetch(url);
          const remote = await response.json();
          providers.push({
            priority: 0,
            config: remote
          });
        }
      }

      if (import.meta.env.PROD) {
        const response = await fetch('/backstage.json');
        const remote = await response.json();
        providers.push({
          priority: 0,
          config: remote
        });
      }

      return providers;
    }
  });

  if (!providers.data) throw new Error('No providers');
  return <Backstage providers={providers.data}>{children}</Backstage>;
};
