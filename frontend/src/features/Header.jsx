import React from 'react';
import { Brain, Clock } from 'lucide-react';

export function Header({ mode = 'Predict', cameraStatus = 'Disconnected', modelStatus = 'Ready' }) {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLearn = mode === 'Learn';
  const isCamOn = cameraStatus === 'Connected';
  const isTraining = modelStatus === 'Training';

  return (
    <header className="glass-strong glass-inset sticky top-0 z-50 flex items-center justify-between px-6 py-3 rounded-none border-x-0 border-t-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-tight leading-none">Cortexium XR</p>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Adaptive AI Vision</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2">
        {/* Mode */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
          isLearn
            ? 'bg-white/8 border-white/15 text-white'
            : 'bg-white/4 border-white/8 text-slate-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLearn ? 'bg-white' : 'bg-slate-500'}`} />
          {mode} Mode
        </div>

        {/* Camera */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
          isCamOn
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-white/4 border-white/8 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCamOn ? 'dot-live' : 'bg-slate-600'}`} />
          Camera {cameraStatus}
        </div>

        {/* Model */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
          isTraining
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            : 'bg-white/4 border-white/8 text-slate-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isTraining ? 'bg-orange-400 animate-pulse' : 'bg-slate-500'}`} />
          {modelStatus}
        </div>
      </div>

      {/* Clock */}
      <div className="flex items-center gap-2 text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono tabular-nums">
          {time.toLocaleTimeString([], { hour12: false })}
        </span>
      </div>
    </header>
  );
}
