import { Save } from '@/components/assets/icons/Save';
import { getIconForFamily } from '@/components/assets/icons/taxa';
import { Note } from '@/components/containers/Note';
import { ObservationEntry } from '@/components/controls/ObservationEntry';
import { BoundingBox, BoundingBoxInput } from '@/components/inputs/BoundingBoxInput';
import { INatTaxaInput } from '@/components/inputs/INatTaxaInput';
import { Timestamp } from '@/components/text/Timestamp';
import { useCreateCaptureFromSnapshot, useSnapshot } from '@/services/api/snapshot';
import { Flags } from '@/services/backstage/config';
import { useFlag } from '@critter/backstage';
import { Button } from '@critter/react/button/juicy';
import { Form } from '@critter/react/forms/Form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useCallback, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { Dock } from '../../components/controls/Dock';
import { Main } from './images/Main';
import { SnapshotProps } from './Snapshot';

const SaveAsCaptureFormFields = z.object({
  name: z.string().optional(),
  keep: z.array(z.string()).min(1),
  discard: z.array(z.string()),

  taxa: z.array(
    z.object({
      id: z.number(),
      scientific: z.string(),
      family: z.string().optional(),
      name: z.string()
    })
  ),

  boundingBoxes: z.array(
    z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    })
  )
});

type SaveAsCaptureFormFields = z.infer<typeof SaveAsCaptureFormFields>;

export const Editor: FC<SnapshotProps> = ({ id }) => {
  const snapshot = useSnapshot(id);

  const [mainImageIndex, setMainImageIndex] = useState<number | undefined>(
    snapshot.data.images.length > 0 ? 0 : undefined
  );

  const methods = useForm<SaveAsCaptureFormFields>({
    resolver: zodResolver(SaveAsCaptureFormFields),
    defaultValues: {
      keep: [],
      discard: [],
      taxa: [],
      boundingBoxes: []
    }
  });

  const navigate = useNavigate();

  const createCapture = useCreateCaptureFromSnapshot();
  const onSubmit = async (data: SaveAsCaptureFormFields) => {
    console.log(data);
    const capture = await createCapture.mutateAsync({
      snapshotId: id,
      images: data.keep,
      name: data.name
    });
    console.log(capture);
    navigate(`/captures/${capture.id}`);
  };

  const onError = (errors: FieldErrors<SaveAsCaptureFormFields>) => {
    if (errors.keep && errors.keep.type === 'too_small') {
      toast(`Make sure you've selected at least one image to keep!`);
      return;
    }

    toast(`Make sure you've filled everything in!`);
  };

  const keep = methods.watch('keep');
  const discard = methods.watch('discard');
  const taxa = methods.watch('taxa');
  const boundingBoxes = methods.watch('boundingBoxes');
  // This is pretty ugly, it's worth wrapping this in a hook
  const setBoundingBoxes = useCallback(
    (valueOrFunction: BoundingBox[] | ((value: BoundingBox[]) => BoundingBox[])) => {
      if (typeof valueOrFunction === 'function') {
        methods.setValue('boundingBoxes', valueOrFunction(methods.getValues('boundingBoxes')), {
          shouldDirty: true
        });
      } else {
        methods.setValue('boundingBoxes', valueOrFunction, { shouldDirty: true });
      }
    },
    [methods]
  );

  const pending = snapshot.data.images.length - keep.length - discard.length;

  const activeCroppingOptions = useFlag<Flags>('crop');

  return (
    <Form
      methods={methods}
      onSubmit={onSubmit}
      onError={onError}
      className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center"
    >
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
          {taxa.map(taxon => (
            <ObservationEntry
              key={taxon.id}
              id={taxon.name}
              iNatId={taxon.id}
              remove={() => {
                methods.setValue(
                  'taxa',
                  taxa.filter(t => t.id !== taxon.id),
                  { shouldDirty: true }
                );
              }}
            >
              {taxon.family && getIconForFamily(taxon.family)}
              {taxon.name}
            </ObservationEntry>
          ))}
          <INatTaxaInput
            placeholder="Search for critter or plant"
            onSelect={taxon => {
              methods.setValue('taxa', [...methods.getValues('taxa'), taxon]);
            }}
          />
        </Note>

        <div className="flex items-center gap-2">
          <Button type="submit" shortcut="S" disabled={snapshot.data.status !== 'complete' || keep.length === 0}>
            <Save />
            {keep.length > 0
              ? pending > 0
                ? 'Discard the rest & save capture'
                : 'Save capture'
              : 'Choose images to keep to save'}
          </Button>
        </div>
      </nav>
      <div className="w-full relative flex-1">
        <div className="h-full flex items-center justify-center">
          {mainImageIndex !== undefined && (
            <Main key={snapshot.data.images[mainImageIndex]} url={snapshot.data.images[mainImageIndex]}>
              {activeCroppingOptions && <BoundingBoxInput value={boundingBoxes} onChange={setBoundingBoxes} />}
            </Main>
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
