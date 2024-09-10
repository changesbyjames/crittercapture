import { Crop } from '@/components/assets/icons/Crop';
import { Save } from '@/components/assets/icons/Save';
import { getIconForFamily } from '@/components/assets/icons/taxa';
import { Note } from '@/components/containers/Note';
import { ObservationEntry } from '@/components/controls/ObservationEntry';
import { BoundingBoxInput, BoundingBoxView } from '@/components/inputs/BoundingBoxInput';
import { INatTaxaInput } from '@/components/inputs/INatTaxaInput';
import { Timestamp } from '@/components/text/Timestamp';
import { useCreateCaptureFromSnapshot, useSnapshot } from '@/services/api/snapshot';
import { FeatureFlag } from '@/services/backstage/FeatureFlag';
import { Button } from '@critter/react/button/juicy';
import { Form, useFormState } from '@critter/react/forms/Form';
import { cn } from '@critter/react/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, Suspense, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { Dock, DockKeyNavigator, PendingIndicator, PreloadImages } from '../../components/controls/Dock';
import { Main } from './images/Main';
import { Thumbnail } from './images/Thumbnail';
import { SnapshotProps } from './Snapshot';

const SaveAsCaptureFormFields = z.object({
  name: z.string().optional(),
  keep: z.array(z.string()).min(1),
  discard: z.array(z.string()),

  boundingBoxes: z.record(
    z.array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      })
    )
  ),

  taxa: z.array(
    z.object({
      id: z.number(),
      scientific: z.string(),
      family: z.string().optional(),
      name: z.string()
    })
  )
});

type SaveAsCaptureFormFields = z.infer<typeof SaveAsCaptureFormFields>;

export const Editor: FC<SnapshotProps> = ({ id }) => {
  const snapshot = useSnapshot(id);
  const createCapture = useCreateCaptureFromSnapshot();

  const methods = useForm<SaveAsCaptureFormFields>({
    resolver: zodResolver(SaveAsCaptureFormFields),
    defaultValues: {
      keep: [],
      discard: [],
      taxa: [],
      boundingBoxes: {}
    }
  });

  const navigate = useNavigate();
  const onSubmit = async (data: SaveAsCaptureFormFields) => {
    console.log(data);
    const capture = await createCapture.mutateAsync({
      snapshotId: id,
      images: data.keep.map(url => {
        const id = url.replace(/\./g, '_');
        const boundingBoxes = data.boundingBoxes[id] ?? [];
        return {
          url,
          boundingBoxes
        };
      }),
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

    console.log(errors);
    toast(`Make sure you've filled everything in!`);
  };

  const [index, setIndex] = useState<number | undefined>(snapshot.data.images.length > 0 ? 0 : undefined);
  const image = index !== undefined ? snapshot.data.images[index] : undefined;

  const [keep, setKeep] = useFormState(methods, 'keep');
  const [discard, setDiscard] = useFormState(methods, 'discard');
  const [taxa, setTaxa] = useFormState(methods, 'taxa');

  const [boundingBoxes, setBoundingBoxes] = useFormState(methods, `boundingBoxes.${image?.replace(/\./g, '_')}`);

  const [editorMode, setEditorMode] = useState(false);
  const pending = snapshot.data.images.length - keep.length - discard.length;

  console.log(methods.getValues());

  return (
    <Form
      methods={methods}
      onSubmit={onSubmit}
      onError={onError}
      className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {!editorMode && (
          <motion.nav
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="w-full relative flex items-center justify-end z-10"
          >
            <Note className="w-fit absolute top-0 left-0 rounded-md min-w-96">
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
                    setTaxa(taxa.filter(t => t.id !== taxon.id));
                  }}
                >
                  {taxon.family && getIconForFamily(taxon.family)}
                  {taxon.name}
                </ObservationEntry>
              ))}
              <INatTaxaInput
                placeholder="Search for critter or plant"
                onSelect={taxon => {
                  setTaxa([...taxa, taxon]);
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
          </motion.nav>
        )}
      </AnimatePresence>
      {editorMode && (
        <nav className="-full relative flex items-center justify-end z-10">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => setEditorMode(false)}>
              Exit crop mode
            </Button>
          </div>
        </nav>
      )}
      <div className="w-full relative flex-1">
        <div className={cn('h-full flex items-center justify-center transition-transform')}>
          {image && (
            <Main key={image} url={image}>
              {editorMode && <BoundingBoxInput value={boundingBoxes ?? []} onChange={setBoundingBoxes} />}
              {!editorMode && <BoundingBoxView boxes={boundingBoxes ?? []} />}
            </Main>
          )}
        </div>
      </div>
      <DockKeyNavigator length={snapshot.data.images.length} index={index} setIndex={setIndex} />
      <Dock
        actions={
          !editorMode && (
            <>
              <Button
                shortcut="K"
                variant="secondary"
                onClick={() => {
                  if (image === undefined) return;
                  setKeep([...keep, image]);
                  setDiscard(discard.filter(i => i !== image));
                }}
              >
                Keep
              </Button>
              <Button
                shortcut="L"
                variant="danger"
                onClick={() => {
                  if (image === undefined) return;
                  setDiscard([...discard, image]);
                  setKeep(keep.filter(i => i !== image));
                }}
              >
                Discard
              </Button>
              <FeatureFlag flag="crop">
                <Button className="px-2 bg-accent-500 hover:bg-accent-600" onClick={() => setEditorMode(!editorMode)}>
                  <Crop className="text-white" />
                </Button>
              </FeatureFlag>
            </>
          )
        }
      >
        {snapshot.data.images.map((image, i) => {
          return (
            <Suspense key={image} fallback={null}>
              <Thumbnail
                url={image}
                selected={index === i}
                onClick={() => setIndex(i)}
                kept={keep.includes(image)}
                discarded={discard.includes(image)}
              />
            </Suspense>
          );
        })}
        {snapshot.data.status !== 'complete' && <PendingIndicator />}
        <PreloadImages images={snapshot.data.images} />
      </Dock>
    </Form>
  );
};
