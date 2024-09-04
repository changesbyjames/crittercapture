import { FC, HTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { Loader } from './Loader';

export const Loading: FC<HTMLAttributes<HTMLDivElement>> = ({ className }) => {
  return (
    <div className={cn('flex h-screen w-screen items-center justify-center bg-accent-100 text-accent-900', className)}>
      <Loader />
    </div>
  );
};
