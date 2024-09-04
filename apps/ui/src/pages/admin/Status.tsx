import { Note } from '@/components/containers/Note';
import { MenuItem } from '@/components/menu/Menu';
import { useAPI } from '@/services/query/hooks';
import { useVariable } from '@critter/backstage';
import { Link } from '@critter/react/button/paper';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';

export const Status: FC = () => {
  const api = useAPI();
  const apiBaseUrl = useVariable('apiBaseUrl');
  const response = useSuspenseQuery({
    queryKey: ['status'],
    queryFn: () => {
      return api.chat.status.query();
    }
  });

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full w-full bg-accent-100">
      <Note className="rounded-lg">
        <h2 className="text-xl font-bold p-2">Status</h2>
        <p className="p-2">
          <strong>Chat status</strong>: {response.data.status}
        </p>
        <p className="p-2">
          <strong>Current channels</strong>: {response.data.channels.join(', ')}
        </p>
        <p className="p-2">
          <strong>Current commands</strong>: {response.data.commands.map(c => `!${c}`).join(', ')}
        </p>
        <MenuItem>
          <Link target="_blank" to={`${apiBaseUrl}/admin/signin`}>
            Sign in as chat account
          </Link>
        </MenuItem>
      </Note>
    </div>
  );
};
