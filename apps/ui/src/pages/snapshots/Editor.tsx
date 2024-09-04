import { Save } from '@/components/assets/icons/Save';
import { Note } from '@/components/containers/Note';
import { Timestamp } from '@/components/text/Timestamp';
import { useSnapshot } from '@/services/api/snapshot';
import { Button } from '@critter/react/button/juicy';
import { Form } from '@critter/react/forms/Form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { z } from 'zod';
import { Dock } from './controls/Dock';
import { Main } from './images/Main';

const SaveAsCaptureFormFields = z.object({
  name: z.string().min(1).max(20),
  keep: z.array(z.string()),
  discard: z.array(z.string())
});

type SaveAsCaptureFormFields = z.infer<typeof SaveAsCaptureFormFields>;

export const Editor: FC = () => {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);
  const snapshot = useSnapshot(id);

  const [mainImageIndex, setMainImageIndex] = useState<number | undefined>(
    snapshot.data.images.length > 0 ? 0 : undefined
  );

  const methods = useForm<SaveAsCaptureFormFields>({
    resolver: zodResolver(SaveAsCaptureFormFields),
    defaultValues: {
      keep: [],
      discard: []
    }
  });

  const onSubmit = (data: SaveAsCaptureFormFields) => {
    console.log(data);
  };

  const keep = methods.watch('keep');
  const discard = methods.watch('discard');

  return (
    <Form methods={methods} onSubmit={onSubmit} className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center">
      <nav className="w-full relative flex items-center justify-end">
        <Note className="w-fit z-10 absolute top-0 left-0 rounded-md min-w-96">
          <input
            {...methods.register('name')}
            autoFocus
            type="text"
            className="text-2xl font-medium px-3 outline-none bg-accent-50 placeholder:opacity-25 placeholder:text-accent-900"
            placeholder="Give your capture a name"
          />
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

        <div className="flex items-center gap-2">
          <Button type="submit" shortcut="S">
            <Save />
            Save capture
          </Button>
        </div>
      </nav>
      <div className="w-full relative flex-1">
        <div className="h-full flex items-center justify-center">
          {mainImageIndex !== undefined && (
            <Main key={snapshot.data.images[mainImageIndex]} url={snapshot.data.images[mainImageIndex]} />
          )}
        </div>
      </div>
      <Dock
        images={snapshot.data.images}
        selectedIndex={mainImageIndex}
        setSelectedIndex={setMainImageIndex}
        kept={keep}
        discarded={discard}
        pending={snapshot.data.status !== 'complete'}
        onKeep={image => {
          methods.setValue('keep', [...keep, image], { shouldDirty: true });
          methods.setValue(
            'discard',
            discard.filter(i => i !== image),
            { shouldDirty: true }
          );
        }}
        onDiscard={image => {
          methods.setValue('discard', [...discard, image], { shouldDirty: true });
          methods.setValue(
            'keep',
            keep.filter(i => i !== image),
            { shouldDirty: true }
          );
        }}
      />
    </Form>
  );
};
