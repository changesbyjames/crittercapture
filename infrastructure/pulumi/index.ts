import { Component, IngestionMode } from '@pulumi/azure-native/insights';
import { getSharedKeysOutput, GetSharedKeysResult, Workspace } from '@pulumi/azure-native/operationalinsights';
import { ResourceGroup } from '@pulumi/azure-native/resources';
import { Config, getProject, getStack } from '@pulumi/pulumi';

import { ManagedEnvironment, ManagedEnvironmentsStorage } from '@pulumi/azure-native/app';
import { API } from './resources/API';

import { Configuration, Database } from '@pulumi/azure-native/dbforpostgresql';
import {
  BlobContainer,
  FileShare,
  Kind,
  listStorageAccountKeysOutput,
  SkuName,
  StorageAccount
} from '@pulumi/azure-native/storage';
import { ListStorageAccountKeysResult } from '@pulumi/azure-native/storage/v20220901';
import { BackstageConfiguration } from './resources/BackstageConfiguration';
import { PostgreSQLFlexibleServer } from './resources/PostgreSQLFlexibleServer';
import { Website } from './resources/Website';

const project = getProject();
const stack = getStack();
const id = `${project}-${stack}`;
const simpleId = `cc${stack}`;

// MARK: Config
const config = new Config();

export = async () => {
  // MARK: Resource Group
  const group = new ResourceGroup(`${id}-group`);

  // MARK: Logs
  const workspace = new Workspace(`${id}-logs`, {
    resourceGroupName: group.name,
    sku: { name: 'PerGB2018' },
    retentionInDays: 30
  });

  const workspaceSharedKey = getSharedKeysOutput({
    resourceGroupName: group.name,
    workspaceName: workspace.name
  }).apply((r: GetSharedKeysResult) => {
    if (!r.primarySharedKey) throw new Error('Primary shared key not found');
    return r.primarySharedKey;
  });

  const appInsights = new Component(`${id}-app-insights`, {
    resourceGroupName: group.name,
    applicationType: 'web',
    kind: 'web',
    ingestionMode: IngestionMode.LogAnalytics,
    workspaceResourceId: workspace.id
  });

  // MARK: Website
  const website = new Website(`${simpleId}-web`, {
    resourceGroupName: group.name,
    type: 'spa'
  });

  const environment = new ManagedEnvironment(`${id}-managed`, {
    resourceGroupName: group.name,
    appLogsConfiguration: {
      destination: 'log-analytics',
      logAnalyticsConfiguration: {
        customerId: workspace.customerId,
        sharedKey: workspaceSharedKey
      }
    }
  });

  const storage = new StorageAccount(simpleId, {
    enableHttpsTrafficOnly: true,
    kind: Kind.StorageV2,
    resourceGroupName: group.name,
    sku: {
      name: SkuName.Standard_LRS
    },
    allowBlobPublicAccess: true
  });

  const key = listStorageAccountKeysOutput({
    resourceGroupName: group.name,
    accountName: storage.name
  }).apply((r: ListStorageAccountKeysResult) => {
    if (!r.keys[0].value) throw new Error('Primary key not found');
    return r.keys[0].value;
  });

  const share = new FileShare(`${simpleId}share`, {
    resourceGroupName: group.name,
    accountName: storage.name
  });

  const environmentStorage = new ManagedEnvironmentsStorage(`${simpleId}-stge`, {
    resourceGroupName: group.name,
    environmentName: environment.name,
    properties: {
      azureFile: {
        accountName: storage.name,
        shareName: share.name,
        accessMode: 'ReadWrite',
        accountKey: key
      }
    }
  });

  const container = new BlobContainer(`${simpleId}-image-blob`, {
    resourceGroupName: group.name,
    accountName: storage.name,
    publicAccess: 'Blob',
    containerName: 'images'
  });

  // MARK: Database
  const server = new PostgreSQLFlexibleServer(`${id}-db`, {
    resourceGroupName: group.name
  });

  new Configuration(`${id}-db-wal-config`, {
    resourceGroupName: group.name,
    serverName: server.name,
    configurationName: 'wal_level',
    source: 'user-override',
    value: 'logical'
  });

  const database = new Database(`${id}-db`, {
    resourceGroupName: group.name,
    serverName: server.name
  });

  const certificateName = config.get('api-certificate-name');

  // MARK: API
  const api = new API(`${id}-api`, {
    name: 'api',
    resourceGroupName: group.name,
    environmentName: environment.name,
    port: 3000,
    env: {
      HOST: '0.0.0.0',

      POSTGRES_HOST: server.host,
      POSTGRES_USER: server.administratorUsername,
      POSTGRES_PASSWORD: server.administratorPassword,
      POSTGRES_SSL: 'true',
      POSTGRES_DB: database.name,

      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',

      JWT_SECRET: config.require('jwt-secret'),
      TWITCH_CLIENT_ID: config.require('twitch-client-id'),
      TWITCH_CLIENT_SECRET: config.require('twitch-client-secret'),
      TWITCH_USERNAME: config.require('twitch-username'),
      UI_URL: `https://${config.require('ui-domain')}`,
      API_URL: `https://${config.require('api-domain')}`,

      STORAGE_ACCOUNT_NAME: storage.name,
      STORAGE_ACCOUNT_KEY: key,
      CONTAINER_NAME: container.name
    },
    image: config.require('api-image'),
    scale: {
      min: 1,
      max: 1,
      noOfRequestsPerInstance: 100
    },
    volumes: {
      dragonfly: {
        storage: environmentStorage,
        path: '/data'
      }
    },
    sidecars: [
      {
        image: 'docker.dragonflydb.io/dragonflydb/dragonfly:latest',
        name: 'dragonfly',
        env: {}
      }
    ],
    domain: certificateName
      ? {
          domain: config.require('api-domain'),
          certificateName: config.require('api-certificate-name')
        }
      : undefined
  });

  // MARK: Backstage
  const backstage = new BackstageConfiguration(`${id}-backstage`, {
    ...website,
    env: {
      variables: {
        apiBaseUrl: `https://${config.require('api-domain')}`,
        imageResizeCDNUrl: config.require('image-resize-cdn-url'),
        appInsightsConnectionString: appInsights.connectionString
      },
      flags: {}
    }
  });
  // MARK: Outputs
  return {
    ...website,
    backstage
  };
};
