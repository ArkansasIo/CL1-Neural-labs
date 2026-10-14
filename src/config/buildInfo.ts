export const BUILD_INFO = {
  productName: 'CL1 Neural Labs',
  applicationName: 'CL1-Neural-labs',
  version: '0.4.0',
  buildId: 'CL1NL-20261013-001',
  buildDate: '2026-10-13',
  developer: 'ArkansasIo',
  organization: 'ArkansasIo',
  copyright: 'Copyright (c) 2026 ArkansasIo',
  license: 'MIT License',
  licenseSpdx: 'MIT',
  channel: 'development',
  apiVersion: 'v1',
  hardwareProfiles: [
    'project-simulator',
    'sdk-simulator',
    'replay',
    'physical-read-only',
  ],
} as const;

export type BuildInfo = typeof BUILD_INFO;
