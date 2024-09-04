import { BackstageConfig } from '@critter/backstage';

export interface Config extends BackstageConfig {
  variables: {
    apiBaseUrl: string;
    imageResizeCDNUrl: string;
    appInsightsConnectionString: string;

    docsBaseUrl: string;
    docsMenu: string;
  };
  flags: {
    b: boolean;
  };
}

export type Variables = keyof Config['variables'];
export type Flags = keyof Config['flags'];
