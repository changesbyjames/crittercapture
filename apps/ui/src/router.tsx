import { useVariable } from '@critter/backstage';
import { Button } from '@critter/react/button/juicy';
import { Link } from '@critter/react/button/paper';
import { Spinner } from '@critter/react/loaders/Spinner';
import { cn } from '@critter/react/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, Suspense, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, RouteObject, useParams } from 'react-router-dom';
import { Save } from './components/assets/icons/Save';
import { Note } from './components/containers/Note';
import { Main } from './layouts/Main';
import { Authenticated } from './pages/authentication/Authenticated';
import { Redirect } from './pages/authentication/Redirect';
import { SignIn } from './pages/authentication/SignIn';
import { SignOut } from './pages/authentication/SignOut';
import { SignOutRedirect } from './pages/authentication/SignOutRedirect';
import { useSnapshot } from './services/api/snapshot';
import { useAPI } from './services/query/hooks';

const auth: RouteObject = {
  path: 'auth',
  children: [
    {
      path: 'signin',
      element: <SignIn />
    },
    {
      path: 'signout',
      element: <SignOut />
    },
    {
      path: 'redirect',
      element: <Redirect />
    },
    {
      path: 'signout/redirect',
      element: <SignOutRedirect />
    }
  ]
};

const usePreload = (url: string) => {
  return useSuspenseQuery({
    queryKey: ['preload', url],
    queryFn: () => {
      return new Promise<null>(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(null);
        img.onerror = () => {
          console.warn('Failed to load image', url);
          resolve(null);
        };
      });
    }
  });
};

const MainImage: FC<{ url: string }> = ({ url }) => {
  const imageResizeCDNUrl = useVariable('imageResizeCDNUrl');

  return (
    <div className="max-w-full max-h-full h-full aspect-video border-[5px] bg-neutral-600 rounded-lg border-accent-300 relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageResizeCDNUrl}/width=100,blur=10/${url})`,
          backfaceVisibility: 'hidden'
        }}
      />
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageResizeCDNUrl}/quality=85/${url})`,
          backfaceVisibility: 'hidden'
        }}
      />
    </div>
  );
};

interface TimestampProps {
  date: Date;
}
const Timestamp: FC<TimestampProps> = ({ date }) => {
  return <span>{formatInTimeZone(date, 'America/Chicago', 'PP p')}</span>;
};

const Home: FC = () => {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);
  const snapshot = useSnapshot(id);
  const imageResizeCDNUrl = useVariable('imageResizeCDNUrl');

  const [selectedShotIndex, setSelectedShotIndex] = useState<number>(0);

  useEffect(() => {
    const abortController = new AbortController();
    const length = snapshot.data.images.length;

    window.addEventListener(
      'keydown',
      e => {
        if (e.key === 'ArrowLeft') {
          const newIndex = Number(selectedShotIndex) - 1;
          if (newIndex < 0) {
            setSelectedShotIndex(length - 1);
          } else {
            setSelectedShotIndex(newIndex);
          }
        }

        if (e.key === 'ArrowRight') {
          const newIndex = Number(selectedShotIndex) + 1;
          if (newIndex >= length) {
            setSelectedShotIndex(0);
          } else {
            setSelectedShotIndex(newIndex);
          }
        }
      },
      { signal: abortController.signal }
    );

    return () => {
      abortController.abort();
    };
  }, [snapshot.data, selectedShotIndex, setSelectedShotIndex]);

  const [keep, setKeep] = useState<string[]>([]);
  const [discard, setDiscard] = useState<string[]>([]);

  return (
    <div className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center">
      <nav className="w-full relative flex items-center justify-end">
        <Note className="w-fit z-10 absolute top-0 left-0 rounded-md min-w-96">
          <input
            autoFocus
            type="text"
            className="text-2xl font-medium px-3 outline-none bg-accent-50 placeholder:opacity-25 placeholder:text-accent-900"
            placeholder="Give your capture a name"
          />
          <p className="px-3 py-1 text-sm">
            Captured by <strong>{snapshot.data.createdBy}</strong>
          </p>
          <p className="px-3 py-1 text-sm">
            Captured at
            <strong>
              <Timestamp date={new Date(snapshot.data.createdAt)} />
            </strong>
          </p>
        </Note>

        <div className="flex items-center gap-2">
          <Button shortcut="S" disabled="Coming soon!">
            <Save />
            Save capture
          </Button>
        </div>
      </nav>
      <div className="w-full relative flex-1">
        <div className="h-full flex items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            <MainImage key={snapshot.data.images[selectedShotIndex]} url={snapshot.data.images[selectedShotIndex]} />
          </AnimatePresence>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-accent-300 rounded-2xl px-5 pt-4 pb-6 flex gap-3 shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]">
          <Button
            shortcut="K"
            variant="secondary"
            onShortcut={() => {
              setSelectedShotIndex(index => {
                if (index === snapshot.data.images.length - 1) {
                  return 0;
                }
                return index + 1;
              });
            }}
            onClick={() => {
              setKeep([...keep, snapshot.data.images[selectedShotIndex]]);
              setDiscard(discard.filter(image => image !== snapshot.data.images[selectedShotIndex]));
            }}
          >
            Keep
          </Button>
          <Button
            shortcut="L"
            variant="danger"
            onShortcut={() => {
              setSelectedShotIndex(index => {
                if (index === snapshot.data.images.length - 1) {
                  return 0;
                }
                return index + 1;
              });
            }}
            onClick={() => {
              setDiscard([...discard, snapshot.data.images[selectedShotIndex]]);
              setKeep(keep.filter(image => image !== snapshot.data.images[selectedShotIndex]));
            }}
          >
            Discard
          </Button>
        </div>
      </div>
      <div className="flex items-center h-20 gap-2 bg-accent-300 rounded-2xl px-4 py-4 w-fit max-w-full">
        <AnimatePresence initial={false}>
          {snapshot.data.images.sort().map((image, index) => {
            return (
              <Suspense key={image} fallback={null}>
                <Thumbnail
                  url={image}
                  selected={selectedShotIndex === index}
                  onClick={() => setSelectedShotIndex(index)}
                  keep={keep.includes(image)}
                  discard={discard.includes(image)}
                />
              </Suspense>
            );
          })}
          {snapshot.data.status !== 'complete' && (
            <div className="h-full w-16 aspect-square flex items-center justify-center text-accent-50">
              <Spinner />
            </div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ height: 0, width: 0 }}>
        {snapshot.data.images.map(image => (
          <img src={`${imageResizeCDNUrl}/quality=85/${image}`} />
        ))}
      </div>
    </div>
  );
};

const Thumbnail: FC<{ url: string; selected: boolean; onClick: () => void; keep: boolean; discard: boolean }> = ({
  url,
  selected,
  onClick,
  keep,
  discard
}) => {
  const imageResizeCDNUrl = useVariable('imageResizeCDNUrl');
  usePreload(`${imageResizeCDNUrl}/quality=60,width=100/${url}`);

  return (
    <div className="relative">
      <motion.button
        key={url}
        onClick={onClick}
        initial={{
          x: '100%',
          opacity: 0
        }}
        animate={{
          x: 0,
          opacity: 1,
          height: selected ? '5rem' : '3.5rem',
          width: selected ? '5rem' : '3.5rem'
        }}
        style={{
          borderWidth: '3px',
          backgroundImage: `url(${imageResizeCDNUrl}/quality=60,width=100/${url})`
        }}
        className={cn('aspect-square bg-center bg-cover rounded-lg bg-accent-300 relative border-white z-10')}
      >
        {keep && (
          <motion.svg
            initial={{
              right: 3,
              top: -3,
              opacity: 0
            }}
            animate={{
              right: 3,
              top: -8,
              opacity: 1
            }}
            className="absolute"
            width="24"
            viewBox="0 0 37 51"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 1.5H31C33.4853 1.5 35.5 3.51472 35.5 6V40.4029C35.5 43.9007 31.6841 46.0612 28.6848 44.2616L22.3587 40.4659C19.9836 39.0409 17.0164 39.0409 14.6413 40.4659L8.31523 44.2616C5.31587 46.0612 1.5 43.9007 1.5 40.4029V6C1.5 3.51472 3.51472 1.5 6 1.5Z"
              fill="#B068F8"
              stroke="white"
              stroke-width="3"
            />
            <path
              d="M17.5489 13.9271C17.8483 13.0058 19.1517 13.0058 19.451 13.9271L20.6329 17.5644C20.7667 17.9764 21.1507 18.2553 21.5839 18.2553H25.4084C26.3771 18.2553 26.7799 19.495 25.9962 20.0644L22.9021 22.3123C22.5516 22.567 22.405 23.0183 22.5388 23.4304L23.7207 27.0676C24.02 27.989 22.9655 28.7551 22.1818 28.1857L19.0878 25.9377C18.7373 25.6831 18.2627 25.6831 17.9122 25.9377L14.8181 28.1857C14.0344 28.7551 12.9799 27.989 13.2793 27.0676L14.4611 23.4304C14.595 23.0183 14.4483 22.567 14.0979 22.3123L11.0038 20.0644C10.2201 19.495 10.6229 18.2553 11.5916 18.2553H15.416C15.8493 18.2553 16.2332 17.9764 16.3671 17.5644L17.5489 13.9271Z"
              fill="white"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16.5979 13.6181C17.1966 11.7754 19.8034 11.7754 20.4021 13.618L21.584 17.2553L25.4084 17.2553C27.3459 17.2553 28.1514 19.7346 26.584 20.8734L23.4899 23.1213L24.6718 26.7586C25.2705 28.6012 23.1615 30.1335 21.5941 28.9947L18.5 26.7467L15.406 28.9947C13.8385 30.1335 11.7296 28.6013 12.3283 26.7586L13.5101 23.1213L10.416 20.8734C8.84861 19.7346 9.65415 17.2553 11.5916 17.2553H15.4161L16.5979 13.6181ZM19.6818 17.8734L18.5 14.2361L17.3182 17.8734C17.0504 18.6974 16.2825 19.2553 15.4161 19.2553L11.5916 19.2553L14.6857 21.5033C15.3866 22.0126 15.68 22.9153 15.4122 23.7394L14.2304 27.3767L17.3244 25.1287C18.0254 24.6194 18.9746 24.6194 19.6756 25.1287L22.7696 27.3767L21.5878 23.7394C21.3201 22.9153 21.6134 22.0126 22.3144 21.5033L25.4084 19.2553H21.584C20.7175 19.2553 19.9496 18.6974 19.6818 17.8734Z"
              fill="white"
            />
          </motion.svg>
        )}

        {discard && (
          <motion.svg
            initial={{
              right: 3,
              top: -3,
              opacity: 0
            }}
            animate={{
              right: 3,
              top: -8,
              opacity: 1
            }}
            className="absolute"
            width="24"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1.5" y="1.5" width="32" height="32" rx="5.5" fill="#F86868" stroke="white" stroke-width="3" />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M22.4048 12.629C22.9397 12.6756 23.3357 13.1469 23.2892 13.6818L22.5168 22.5639C22.5168 22.5639 22.5168 22.5639 22.5168 22.564C22.3906 24.0154 21.1755 25.1293 19.7187 25.1293H15.2813C13.8244 25.1293 12.6094 24.0154 12.4832 22.564L13.4517 22.4797L12.4832 22.564L11.7108 13.6818C11.6643 13.1469 12.0602 12.6756 12.5952 12.629C13.1301 12.5825 13.6014 12.9785 13.648 13.5134L14.4203 22.3955C14.4591 22.8421 14.833 23.1848 15.2813 23.1848H19.7187C20.167 23.1848 20.5408 22.8421 20.5796 22.3956L20.5796 22.3955L21.352 13.5134C21.3985 12.9785 21.8699 12.5825 22.4048 12.629Z"
              fill="white"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M17.2705 11.8152C16.7932 11.8152 16.4063 12.2021 16.4063 12.6794V13.3681C16.4063 13.905 15.971 14.3403 15.434 14.3403C14.8971 14.3403 14.4618 13.905 14.4618 13.3681V12.6794C14.4618 11.1283 15.7192 9.87079 17.2705 9.87079H17.7296C19.2808 9.87079 20.5382 11.1283 20.5382 12.6794V13.3681C20.5382 13.905 20.1029 14.3403 19.566 14.3403C19.029 14.3403 18.5938 13.905 18.5938 13.3681V12.6794C18.5938 12.2021 18.2069 11.8152 17.7296 11.8152H17.2705Z"
              fill="white"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M10.1003 13.5976C10.1003 13.0607 10.5356 12.6254 11.0726 12.6254H23.9275C24.4644 12.6254 24.8997 13.0607 24.8997 13.5976C24.8997 14.1346 24.4644 14.5699 23.9275 14.5699H11.0726C10.5356 14.5699 10.1003 14.1346 10.1003 13.5976Z"
              fill="white"
            />
          </motion.svg>
        )}
      </motion.button>
      {selected && (
        <motion.div
          layout
          layoutId="selected-thumbnail"
          style={{
            width: '6.5rem',
            height: '6.5rem'
          }}
          className="absolute -left-3 -top-3 bg-accent-300 rounded-3xl"
        ></motion.div>
      )}
    </div>
  );
};

const Status: FC = () => {
  const api = useAPI();
  const apiBaseUrl = useVariable('apiBaseUrl');
  const response = useSuspenseQuery({
    queryKey: ['status'],
    queryFn: () => {
      return api.chat.status.query();
    }
  });

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
      {JSON.stringify(response.data)}
      <Link target="_blank" to={`${apiBaseUrl}/admin/signin`}>
        Sign in as chat account
      </Link>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    element: <Authenticated />,
    children: [
      {
        element: <Main />,
        children: [
          {
            path: '/status',
            element: <Status />
          },
          {
            path: '/snapshots/:id',
            element: <Home />
          }
        ]
      }
    ]
  },
  auth
]);
