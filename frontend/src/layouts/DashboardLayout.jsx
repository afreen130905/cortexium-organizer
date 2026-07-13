import React from 'react';
import { Header } from '../features/Header';
import { Footer } from '../features/Footer';

export function DashboardLayout({ children, mode, cameraStatus, modelStatus }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080a0f] text-slate-200 relative">
      {/* Subtle ambient — very muted, not blue/purple */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[30vh] rounded-full bg-white/[0.012] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[40vw] h-[25vh] rounded-full bg-orange-500/[0.03] blur-[100px] pointer-events-none" />

      <Header mode={mode} cameraStatus={cameraStatus} modelStatus={modelStatus} />

      <main className="flex-1 p-4 lg:p-5 overflow-auto">
        <div className="max-w-screen-2xl mx-auto h-full">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
