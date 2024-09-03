import { exchangeCode } from '@twurple/auth';
import z from 'zod';
import { useEnvironment } from '../../../utils/env/env.js';

const scopes = ['chat:read', 'chat:edit', 'user:read:chat', 'user:write:chat'];
export const createSignInRequest = (path: string, state: string) => {
  const env = useEnvironment();
  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', env.variables.TWITCH_CLIENT_ID);
  url.searchParams.set('redirect_uri', `http://${env.variables.HOST}:${env.variables.PORT}${path}`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
};

export const exchangeCodeForToken = async (code: string) => {
  const env = useEnvironment();
  const token = await exchangeCode(
    env.variables.TWITCH_CLIENT_ID,
    env.variables.TWITCH_CLIENT_SECRET,
    code,
    `http://${env.variables.HOST}:${env.variables.PORT}/auth/redirect`
  );

  return token;
};

const TwitchAccessToken = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresIn: z.number().nullable(),
  scope: z.array(z.string()),
  obtainmentTimestamp: z.number()
});

export const saveToken = async (token: z.infer<typeof TwitchAccessToken>) => {
  const env = useEnvironment();
  await env.redis.set('twitch:token', JSON.stringify(token));
};

export const restoreToken = async () => {
  const env = useEnvironment();
  const token = await env.redis.get('twitch:token');
  if (!token) return;

  const parsed = TwitchAccessToken.safeParse(JSON.parse(token));
  if (!parsed.success) {
    console.warn(`Invalid token in redis: ${token}`);
    return;
  }
  return parsed.data;
};

const TwitchValidationResponse = z.object({
  user_id: z.string()
});

export const validateToken = async (token: string) => {
  const response = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return false;
  const data = await response.json();
  const result = TwitchValidationResponse.safeParse(data);
  if (!result.success) return false;
  return true;
};

const TwitchUsersResponse = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_name: z.string(),
      login: z.string()
    })
  )
});

export const getUserInformation = async (token: string) => {
  const env = useEnvironment();
  const response = await fetch(`https://api.twitch.tv/helix/users`, {
    headers: { Authorization: `Bearer ${token}`, 'client-id': env.variables.TWITCH_CLIENT_ID }
  });

  if (!response.ok) throw new Error('Failed to fetch user data');
  const data = await response.json();
  const result = TwitchUsersResponse.safeParse(data);
  if (!result.success) throw new Error('Invalid response');
  const user = result.data.data[0];
  if (!user) throw new Error('No user found');
  return user;
};
