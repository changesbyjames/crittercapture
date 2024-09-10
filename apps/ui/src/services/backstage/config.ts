import { BackstageConfig } from '@critter/backstage';

export interface Config extends BackstageConfig {
  variables: {
    apiBaseUrl: string;
    imageResizeCDNUrl: string;
    appInsightsConnectionString: string;

    docsUrl: string;
  };
  flags: {
    crop: boolean;
  };
}

export type Variables = keyof Config['variables'];
export type Flags = keyof Config['flags'];
