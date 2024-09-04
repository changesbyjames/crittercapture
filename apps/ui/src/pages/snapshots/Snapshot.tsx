import { usePermissions } from '@/services/permissions/hooks';
import { FC } from 'react';
import { Editor } from './Editor';
import { ReadOnly } from './ReadOnly';

export const Snapshot: FC = () => {
  const { editor } = usePermissions();
  if (editor) return <Editor />;
  return <ReadOnly />;
};
