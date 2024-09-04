import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { key, useAPI, useLiveQuery } from '../query/hooks';

export const useSnapshot = (id: number) => {
  const snapshotQueryKey = useMemo(() => key('snapshot', id.toString()), [id]);
  const trpc = useAPI();
  const callback = useLiveQuery(snapshotQueryKey);

  const result = useSuspenseQuery({
    queryKey: snapshotQueryKey,
    queryFn: () => {
      return trpc.snapshot.snapshot.query({ id });
    }
  });

  useEffect(() => {
    if (result.data.status === 'complete') return;
    const subscription = trpc.snapshot.live.snapshot.subscribe({ id }, callback);
    return () => subscription.unsubscribe();
  }, []);

  return result;
};

interface CreateCaptureFromSnapshotInput {
  snapshotId: number;
  images: string[];
  name?: string;
}
export const useCreateCaptureFromSnapshot = () => {
  const trpc = useAPI();
  return useMutation({
    mutationFn: (input: CreateCaptureFromSnapshotInput) => trpc.capture.snapshotToCapture.mutate(input)
  });
};
