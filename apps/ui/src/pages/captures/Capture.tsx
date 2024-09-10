import { Note } from '@/components/containers/Note';
import { BoundingBoxView } from '@/components/inputs/BoundingBoxInput';
import { Timestamp } from '@/components/text/Timestamp';
import { useCapture } from '@/services/api/capture';
import { FC, Suspense, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Dock, DockKeyNavigator } from '../../components/controls/Dock';
import { Main } from '../snapshots/images/Main';
import { Thumbnail } from '../snapshots/images/Thumbnail';

export const Capture: FC = () => {
  const params = useParams();
  const id = useMemo(() => Number(params.id), [params.id]);
  const snapshot = useCapture(id);

  const [index, setIndex] = useState<number | undefined>(snapshot.data.images.length > 0 ? 0 : undefined);

  return (
    <div className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center">
      <nav className="w-full relative flex items-center justify-end">
        <Note className="w-fit z-10 absolute top-0 left-0 rounded-md min-w-96">
          <h2 className="text-2xl font-medium px-3 outline-none bg-accent-50 placeholder:opacity-25 placeholder:text-accent-900">
            {snapshot.data.name}
          </h2>
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
          {index !== undefined && (
            <Main key={snapshot.data.images[index].id} url={snapshot.data.images[index].url}>
              <BoundingBoxView boxes={snapshot.data.images[index].boundingBoxes ?? []} />
            </Main>
          )}
        </div>
      </div>
      <Dock>
        <DockKeyNavigator length={snapshot.data.images.length} index={index} setIndex={setIndex} />
        {snapshot.data.images.map((image, i) => {
          return (
            <Suspense key={image.id} fallback={null}>
              <Thumbnail url={image.url} selected={index === i} onClick={() => setIndex(i)} />
            </Suspense>
          );
        })}
      </Dock>
    </div>
  );
};
