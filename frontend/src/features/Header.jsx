import React from 'react';
import { Brain, Clock } from 'lucide-react';

export function Header({ mode = 'Predict', cameraStatus = 'Disconnected', modelStatus = 'Ready' }) {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLearn    = mode === 'Learn';
  const isCamOn    = cameraStatus === 'Connected';
  const isTraining = modelStatus === 'Training';

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-tight leading-none">Cortexium XR</p>
          <p className="text-[10px] text-slate-300 leading-none mt-0.5">Adaptive AI Vision</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2">
        {/* Mode */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors backdrop-blur-md ${
        isLearn
          ? 'bg-orange-500/20 border-orange-400/30 text-orange-200'
          : 'bg-white/10 border-white/10 text-slate-200'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLearn ? 'bg-orange-400' : 'bg-slate-300'}`} />
          {mode} Mode
        </div>

        {/* Camera */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
          isCamOn
            ? 'bg-green-500/20 border-green-400/30 text-green-200'
            : 'bg-white/10 border-white/10 text-slate-200'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCamOn ? 'dot-live' : 'bg-gray-300'}`} />
          Camera {cameraStatus}
        </div>

        {/* Model */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
          isTraining
            ? 'bg-orange-500/20 border-orange-400/30 text-orange-200'
            : 'bg-white/10 border-white/10 text-slate-200'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isTraining ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`} />
          {modelStatus}
        </div>
      </div>

      {/* Clock */}
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {time.toLocaleTimeString([], { hour12: false })}
        </span>
      </div>
    </header>
  );
}
