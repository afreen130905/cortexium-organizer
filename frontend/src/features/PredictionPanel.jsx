import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function PredictionPanel({ misplacedObject, cameraActive, connected }) {
  if (!connected || !cameraActive) {
    return (
      <GlassCard className="flex items-center justify-center py-6">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            Camera is not running
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Start the camera to begin placement analysis.
          </p>
        </div>
      </GlassCard>
    );
  }
  if (!misplacedObject) {
    return (
      <GlassCard className="flex items-center gap-3 py-4" accent="#22c55e">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-400">All objects correctly placed</p>
          <p className="text-xs text-slate-500 mt-0.5">No misplacements detected</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-3" accent="#ef4444">
      {/* Title */}
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-400">Misplacement Detected</span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {(misplacedObject.confidence * 100).toFixed(0)}% conf
        </span>
      </div>

      {/* Object → Surface flow */}
      <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/6">
        <div className="flex-1 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Object</p>
          <p className="text-base font-semibold text-white capitalize">{misplacedObject.name}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">from</p>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">to</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Move To</p>
          <p className="text-base font-semibold text-orange-400 capitalize">{misplacedObject.recommendedSurface}</p>
        </div>
      </div>

      {/* Current surface */}
      <p className="text-xs text-slate-500">
        Currently on <span className="text-slate-300">{misplacedObject.currentSurface}</span>.{' '}
        {misplacedObject.explanation}
      </p>
    </GlassCard>
  );
}
