import React from 'react';
import { BUILD_INFO } from '../config/buildInfo';

export const LicenseCredits: React.FC = () => (
  <section className="rounded-xl border border-slate-800 bg-[#0b111d] p-4 text-sm">
    <h2 className="mb-2 font-semibold text-slate-100">Developer & License</h2>
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div><span className="text-slate-500">Developer:</span> {BUILD_INFO.developer}</div>
      <div><span className="text-slate-500">Copyright:</span> {BUILD_INFO.copyright}</div>
      <div><span className="text-slate-500">License:</span> {BUILD_INFO.license}</div>
      <div><span className="text-slate-500">SPDX:</span> {BUILD_INFO.licenseSpdx}</div>
      <div><span className="text-slate-500">Version:</span> v{BUILD_INFO.version}</div>
      <div><span className="text-slate-500">Build:</span> {BUILD_INFO.buildId}</div>
    </div>
  </section>
);
