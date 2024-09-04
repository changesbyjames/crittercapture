import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { useEnvironment } from '../../utils/env/env.js';
import { createSnapshotRequest } from '../snapshot/index.js';
import { restoreToken, saveToken } from './auth/token.js';
interface Status {
  status: 'pending' | 'offline:not_authenticated' | 'offline' | 'online';
  channels: string[];
  commands: string[];
}

const handler: Record<string, (chat: ChatClient, channel: string, user: string, message: string) => Promise<void>> = {
  capture: async (chat: ChatClient, channel: string, user: string, message: string) => {
    const env = useEnvironment();
    const [_, duration, rewind] = message.split(' ');
    if (isNaN(Number(duration)) || isNaN(Number(rewind))) {
      chat.say(channel, `@${user} Invalid duration or rewind. Please use !capture <duration> <rewind>`);
      return;
    }
    const request = await createSnapshotRequest('twitch', user, Number(duration), Number(rewind));
    chat.say(channel, `@${user} Critter captured! ${env.variables.UI_URL}/snapshots/${request.id}`);
  }
};

export const status: Status = {
  status: 'pending',
  channels: ['strangecyan', 'alveusgg'],
  commands: Object.keys(handler)
};

export const start = async () => {
  const env = useEnvironment();

  const token = await restoreToken();
  if (!token) {
    status.status = 'offline:not_authenticated';
    return;
  }

  const auth = new RefreshingAuthProvider({
    clientId: env.variables.TWITCH_CLIENT_ID,
    clientSecret: env.variables.TWITCH_CLIENT_SECRET
  });

  auth.onRefresh((_, token) => saveToken(token));
  await auth.addUserForToken(token, ['chat']);

  const chat = new ChatClient({ authProvider: auth, channels: status.channels });
  chat.onConnect(() => (status.status = 'online'));

  chat.onDisconnect(() => (status.status = 'offline'));

  chat.connect();

  chat.onMessage(async (channel, user, message) => {
    if (!message.startsWith('!')) return;

    for (const command of status.commands) {
      if (message.startsWith(`!${command}`)) {
        await handler[command](chat, channel, user, message);
      }
    }
  });
};
