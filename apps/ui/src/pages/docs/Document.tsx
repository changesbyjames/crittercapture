import { Variables } from '@/services/backstage/config';
import { useVariable } from '@critter/backstage';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';

const Menu = z.record(z.record(z.string()));

const useDocsMenu = () => {
  const docsBaseUrl = useVariable<Variables>('docsBaseUrl');
  const docsMenu = useVariable<Variables>('docsMenu');
  return useSuspenseQuery({
    queryKey: ['docs', 'menu'],
    queryFn: async () => {
      const response = await fetch(`${docsBaseUrl}${docsMenu}`);
      if (!response.ok) {
        throw new Error('Failed to fetch docs menu');
      }
      return Menu.parse(await response.json());
    }
  });
};

export const Document = () => {
  const { data: menu } = useDocsMenu();
  return <div className="w-full max-w-3xl mx-auto">{JSON.stringify(menu)}</div>;
};
