import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const url = '';

export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: 'http://localhost:35523',
    imageResizeCDNUrl: 'https://crittercapture.club/cdn-cgi/image'
  },
  flags: {}
};
