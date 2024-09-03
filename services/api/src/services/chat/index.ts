import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { useEnvironment } from '../../utils/env/env.js';
import { createSnapshotRequest } from '../snapshot/index.js';
import { restoreToken, saveToken } from './auth/auth.js';

export const start = async () => {
  const env = useEnvironment();

  const token = await restoreToken();
  if (!token) throw new Error('No token found, cannot start chat. Please sign in.');
  const auth = new RefreshingAuthProvider({
    clientId: env.variables.TWITCH_CLIENT_ID,
    clientSecret: env.variables.TWITCH_CLIENT_SECRET
  });

  auth.onRefresh((userId, token) => saveToken(token));
  await auth.addUserForToken(token, ['chat']);

  const chat = new ChatClient({ authProvider: auth, channels: ['strangecyan', 'alveusgg'] });
  chat.connect();

  chat.onMessage(async (channel, user, message) => {
    if (!message.startsWith('!')) return;

    if (message.startsWith('!polcapture')) {
      const [command, duration, rewind] = message.split(' ');
      if (isNaN(Number(duration)) || isNaN(Number(rewind))) {
        chat.say(channel, `@${user} Invalid duration or rewind. Please use !polcapture <duration> <rewind>`);
        return;
      }
      const request = await createSnapshotRequest('twitch', user, Number(duration), Number(rewind));
      chat.say(channel, `@${user} Critter captured! ${env.variables.UI_URL}/snapshots/${request.id}`);
    }
  });
};
