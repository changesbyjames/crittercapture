import { Variables } from '@/services/backstage/config';
import { useVariable } from '@critter/backstage';
import { Button } from '@critter/react/button/juicy';
import { Spinner } from '@critter/react/loaders/Spinner';
import { AnimatePresence } from 'framer-motion';
import { FC, Suspense, useEffect } from 'react';
import { Thumbnail } from '../../pages/snapshots/images/Thumbnail';

interface DockProps {
  images: string[];
  selectedIndex?: number;
  setSelectedIndex: (index: number) => void;

  onKeep?: (image: string, index: number) => void;
  onDiscard?: (image: string, index: number) => void;
  kept?: string[];
  discarded?: string[];

  pending?: boolean;
}

export const Dock: FC<DockProps> = ({
  images,
  selectedIndex,
  setSelectedIndex,
  onKeep,
  onDiscard,
  pending = false,
  kept = [],
  discarded = []
}) => {
  const imageResizeCDNUrl = useVariable<Variables>('imageResizeCDNUrl');

  const readOnly = !onKeep && !onDiscard;

  useEffect(() => {
    const abortController = new AbortController();
    const length = images.length;

    window.addEventListener(
      'keydown',
      e => {
        if (e.key === 'ArrowLeft') {
          if (selectedIndex === undefined) {
            if (images.length === 0) return;
            setSelectedIndex(images.length - 1);
            return;
          }
          const newIndex = selectedIndex - 1;
          if (newIndex < 0) {
            setSelectedIndex(length - 1);
          } else {
            setSelectedIndex(newIndex);
          }
        }

        if (e.key === 'ArrowRight') {
          if (selectedIndex === undefined) {
            if (images.length === 0) return;
            setSelectedIndex(0);
            return;
          }
          const newIndex = selectedIndex + 1;
          if (newIndex >= length) {
            setSelectedIndex(0);
          } else {
            setSelectedIndex(newIndex);
          }
        }
      },
      { signal: abortController.signal }
    );

    return () => {
      abortController.abort();
    };
  }, [images, selectedIndex, setSelectedIndex]);

  return (
    <div className="w-fit max-w-full relative h-28 flex items-center">
      {!readOnly && (
        <div className="absolute -top-[80%] left-1/2 z-20 -translate-x-1/2 bg-accent-300 rounded-2xl px-5 pt-4 pb-6 flex gap-3 shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]">
          <Button
            shortcut="K"
            variant="secondary"
            onClick={() => selectedIndex !== undefined && onKeep?.(images[selectedIndex], selectedIndex)}
          >
            Keep
          </Button>
          <Button
            shortcut="L"
            variant="danger"
            onClick={() => selectedIndex !== undefined && onDiscard?.(images[selectedIndex], selectedIndex)}
          >
            Discard
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 h-20 bg-accent-300 rounded-2xl px-4 py-4 w-fit max-w-full">
        <AnimatePresence initial={false}>
          {images.sort().map((image, index) => {
            return (
              <Suspense key={image} fallback={null}>
                <Thumbnail
                  url={image}
                  selected={selectedIndex === index}
                  onClick={() => setSelectedIndex(index)}
                  kept={kept.includes(image)}
                  discarded={discarded.includes(image)}
                />
              </Suspense>
            );
          })}
          {pending && (
            <div className="h-full w-20 aspect-square flex items-center justify-center text-accent-50">
              <Spinner />
            </div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ height: 0, width: 0 }}>
        {images.map(image => (
          <img src={`${imageResizeCDNUrl}/quality=85/${image}`} />
        ))}
      </div>
    </div>
  );
};
