import { Note } from '@/components/containers/Note';
import { Timestamp } from '@/components/text/Timestamp';
import { useSnapshot } from '@/services/api/snapshot';
import { FC, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Dock } from './controls/Dock';
import { Main } from './images/Main';

export const ReadOnly: FC = () => {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);
  const snapshot = useSnapshot(id);

  const [mainImageIndex, setMainImageIndex] = useState<number | undefined>(
    snapshot.data.images.length > 0 ? 0 : undefined
  );

  return (
    <div className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center">
      <nav className="w-full relative flex items-center justify-end">
        <Note className="w-fit z-10 absolute top-0 left-0 rounded-md min-w-96">
          <p className="px-3 py-1 text-sm">
            Captured by <strong>{snapshot.data.createdBy}</strong>
          </p>
          <p className="px-3 py-1 text-sm">
            Captured at{' '}
            <strong>
              <Timestamp date={new Date(snapshot.data.createdAt)} />
            </strong>
          </p>
        </Note>
      </nav>
      <div className="w-full relative flex-1">
        <div className="h-full flex items-center justify-center">
          {mainImageIndex !== undefined && (
            <Main key={snapshot.data.images[mainImageIndex]} url={snapshot.data.images[mainImageIndex]} />
          )}
        </div>
      </div>
      <Dock images={snapshot.data.images} selectedIndex={mainImageIndex} setSelectedIndex={setMainImageIndex} />
    </div>
  );
};
