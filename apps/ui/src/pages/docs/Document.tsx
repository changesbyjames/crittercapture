import { Note } from '@/components/containers/Note';
import { MenuItem } from '@/components/menu/Menu';
import { Variables } from '@/services/backstage/config';
import { useVariable } from '@critter/backstage';
import { Link } from '@critter/react/button/paper';
import { useSuspenseQuery } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import { Outlet, useParams } from 'react-router';

import { z } from 'zod';

const Menu = z.record(z.union([z.string(), z.record(z.string())]));

const useDocsMenu = () => {
  const docsBaseUrl = useVariable<Variables>('docsBaseUrl');
  const docsMenu = useVariable<Variables>('docsMenu');
  return useSuspenseQuery({
    queryKey: ['docs', 'menu'],
    queryFn: async () => {
      const response = await fetch(`${docsBaseUrl}${docsMenu}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch docs menu');
      }
      return Menu.parse(await response.json());
    }
  });
};

export const Docs = () => {
  const { data: menu } = useDocsMenu();
  return (
    <div className="w-full h-full bg-accent-100 pt-8 overflow-y-scroll px-8">
      <div className="w-full max-w-4xl mx-auto flex gap-4">
        <Note className="w-full max-w-72 h-fit sticky top-0">
          {Object.entries(menu).map(([title, linkOrChildren]) =>
            typeof linkOrChildren === 'string' ? (
              <MenuItem>
                <Link to={`/docs/${encodeURIComponent(linkOrChildren)}`}>{title}</Link>
              </MenuItem>
            ) : (
              <div className="pt-1 divide-y divide-[#F5EFD7]">
                <label className="text-accent-900 text-sm font-bold px-4">{title}</label>
                {Object.entries(linkOrChildren).map(([title, link]) => (
                  <MenuItem>
                    <Link to={`/docs/${encodeURIComponent(link)}`}>{title}</Link>
                  </MenuItem>
                ))}
              </div>
            )
          )}
        </Note>
        <Outlet />
      </div>
    </div>
  );
};

export const Document = () => {
  const { id } = useParams();
  const docsBaseUrl = useVariable<Variables>('docsBaseUrl');

  const { data: document } = useSuspenseQuery({
    queryKey: ['docs', 'document', id],
    queryFn: async () => {
      const response = await fetch(`${docsBaseUrl}${id}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      return response.text();
    }
  });
  return (
    <Note className="w-full prose prose-headings:text-accent-950 prose-headings:mt-0">
      <div className="py-8 px-8">
        <Markdown>{document}</Markdown>
      </div>
    </Note>
  );
};
