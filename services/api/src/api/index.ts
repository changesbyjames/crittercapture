import { router } from '../trpc/trpc.js';
import chat from './chat.js';
import feed from './feed.js';
import me from './me.js';
import snapshot from './snapshot.js';

export default router({
  me,
  feed,
  snapshot,
  chat
});
