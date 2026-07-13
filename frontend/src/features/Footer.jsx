import React from 'react';

export function Footer() {
  return (
    <footer className="flex items-center justify-between px-6 py-2.5 border-t border-white/5 bg-white/[0.01] text-[10px] text-slate-600 font-mono">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 4px #22c55e' }} />
          YOLOv8s
        </span>
        <span>Random Forest</span>
        <span>FastAPI + WebSocket</span>
      </div>
      <span>Cortexium XR v1.0</span>
    </footer>
  );
}
