import React from 'react';
import { BUILD_INFO } from '../config/buildInfo';

export const BuildIdentity: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500" title={`Build ${BUILD_INFO.buildId}`}>
    <span className="text-slate-300">{BUILD_INFO.productName}</span>
    <span>v{BUILD_INFO.version}</span>
    <span>Build {BUILD_INFO.buildId}</span>
    <span>Developer: {BUILD_INFO.developer}</span>
    <span>{BUILD_INFO.channel}</span>
  </div>
);
