import React from 'react';
import { BUILD_INFO } from '../config/buildInfo';
import { ShieldCheck } from 'lucide-react';

export const SystemInfoPanel: React.FC = () => (
  <section className="rounded-xl border border-slate-800 bg-[#0b111d] p-4 text-sm">
    <div className="mb-3 flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-cyan-400" />
      <h2 className="font-semibold text-slate-100">System Information</h2>
    </div>
    <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <dt className="text-slate-500">Product</dt><dd>{BUILD_INFO.productName}</dd>
      <dt className="text-slate-500">Application</dt><dd>{BUILD_INFO.applicationName}</dd>
      <dt className="text-slate-500">Version</dt><dd>v{BUILD_INFO.version}</dd>
      <dt className="text-slate-500">Build ID</dt><dd className="font-mono">{BUILD_INFO.buildId}</dd>
      <dt className="text-slate-500">Build date</dt><dd>{BUILD_INFO.buildDate}</dd>
      <dt className="text-slate-500">Developer</dt><dd>{BUILD_INFO.developer}</dd>
      <dt className="text-slate-500">Organization</dt><dd>{BUILD_INFO.organization}</dd>
      <dt className="text-slate-500">API</dt><dd>{BUILD_INFO.apiVersion}</dd>
      <dt className="text-slate-500">Channel</dt><dd>{BUILD_INFO.channel}</dd>
      <dt className="text-slate-500">Hardware profiles</dt>
      <dd>{BUILD_INFO.hardwareProfiles.join(', ')}</dd>
    </dl>
  </section>
);
