import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const url = 'https://ccprodweb832aa1fe.z5.web.core.windows.net//backstage.json';

export const config: DeepPartial<Config> = {
  variables: {
    // apiBaseUrl: 'https://crittercapture-prod-api00cc72bd.mangomoss-f35f7411.westus2.azurecontainerapps.io',
    imageResizeCDNUrl: 'https://crittercapture.club/cdn-cgi/image'
  },
  flags: {}
};
