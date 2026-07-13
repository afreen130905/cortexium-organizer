import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { BrainCircuit } from 'lucide-react';

/** Small stat row inside the learning panel */
function StatRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: accent || '#f8fafc' }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

export function LearningPanel({ learningData, modelStatus }) {
  const threshold = learningData?.retrainThreshold ?? 5;
  const newSamples = learningData?.newSamples ?? 0;
  const nextAt = Math.max(0, threshold - newSamples);
  const progress = Math.min(1, newSamples / threshold);
  const isTraining = modelStatus === 'Training';

  return (
    <GlassCard className="flex flex-col" accent="#f8fafc">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-semibold text-slate-200">Adaptive Learning</span>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          isTraining
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            : 'bg-white/4 border-white/8 text-slate-500'
        }`}>
          <span className={`w-1 h-1 rounded-full ${isTraining ? 'bg-orange-400 animate-pulse' : 'bg-slate-500'}`} />
          {isTraining ? 'Training…' : (modelStatus || 'Ready')}
        </span>
      </div>

      {/* Stats */}
      <div className="flex-1">
        <StatRow label="Learned Relationships"  value={learningData?.totalRelationships ?? 0} />
        <StatRow label="Total Training Samples" value={learningData?.datasetSize ?? 0} />
        <StatRow label="New Samples (this session)" value={newSamples} accent="#22c55e" />
        <StatRow
          label="Last Retraining"
          value={learningData?.lastRetrainTime || 'Never'}
          accent="#9ca3af"
        />
      </div>

      {/* Auto-retrain progress */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Next Auto-Retrain</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {isTraining ? 'In progress…' : `${nextAt} samples remaining`}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress * 100}%`,
              background: isTraining
                ? 'linear-gradient(90deg, #f97316, #fb923c)'
                : 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.6))',
            }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
