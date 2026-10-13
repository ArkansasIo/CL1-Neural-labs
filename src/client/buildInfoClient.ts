import { BUILD_INFO } from '../config/buildInfo';

export interface BuildInfoResponse {
  productName: string;
  applicationName: string;
  version: string;
  buildId: string;
  buildDate: string;
  developer: string;
  organization: string;
  channel: string;
  apiVersion: string;
  hardwareProfiles: readonly string[];
}

export function getBuildInfo(): BuildInfoResponse {
  return BUILD_INFO;
}
