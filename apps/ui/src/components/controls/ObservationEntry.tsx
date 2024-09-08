import { cn } from '@critter/react/utils/cn';
import { FC, PropsWithChildren } from 'react';

interface ObservationEntryProps {
  id: string;
  iNatId: number;
}

interface ObservationEntryActions {
  remove?: () => void;
}

export const ObservationEntry: FC<PropsWithChildren<ObservationEntryProps & ObservationEntryActions>> = ({
  id,
  iNatId,
  children,
  remove
}) => {
  return (
    <div key={id} className="px-3 flex flex-row-reverse gap-2 items-center w-full">
      <div className="peer group text-xs w-full flex justify-end gap-2">
        <p className={cn(remove && 'group-hover:hidden')}>self-reported</p>
        {remove && (
          <button className="text-red-600 hidden group-hover:block underline font-bold" onClick={remove}>
            remove this?
          </button>
        )}
      </div>
      <a
        href={`https://www.inaturalist.org/taxa/${iNatId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex max-w-fit items-center cursor-pointer gap-1 py-1.5 w-full text-sm bg-transparent font-bold text-accent-800 outline-none',
          remove && 'peer-hover:text-red-600 peer-hover:line-through'
        )}
      >
        {children}
      </a>
    </div>
  );
};
