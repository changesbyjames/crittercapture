import { useSuspenseQuery } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export const useCapture = (id: number) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('capture', id.toString()),
    queryFn: () => {
      return trpc.capture.capture.query({ id });
    }
  });
};
