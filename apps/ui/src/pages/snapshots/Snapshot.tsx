import { useSnapshot } from '@/services/api/snapshot';
import { usePermissions } from '@/services/permissions/hooks';
import { FC, useMemo } from 'react';
import { Navigate, useParams } from 'react-router';
import { Editor } from './Editor';
import { ReadOnly } from './ReadOnly';

export interface SnapshotProps {
  id: number;
}

export const Snapshot: FC = () => {
  const { editor } = usePermissions();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);
  const snapshot = useSnapshot(id);

  if (snapshot.data.captureId) {
    return <Navigate to={`/captures/${snapshot.data.captureId}`} />;
  }

  if (editor) return <Editor id={id} />;
  return <ReadOnly id={id} />;
};
