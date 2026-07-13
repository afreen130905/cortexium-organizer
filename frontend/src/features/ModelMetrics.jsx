import React from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

/** Single metric bar row */
function MetricBar({ label, value, color }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 progress-track">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-200 w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}

/** Confusion matrix mini-grid */
function ConfusionMatrix({ matrix, classes }) {
  if (!matrix || matrix.length === 0) return null;
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="mt-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Confusion Matrix</p>
      <div className="overflow-auto">
        <table className="text-[10px] border-collapse w-full">
          <thead>
            <tr>
              <th className="w-8" />
              {(classes || matrix[0].map((_, i) => `C${i}`)).map((c, i) => (
                <th key={i} className="px-1 py-0.5 text-slate-500 font-normal text-center capitalize truncate max-w-[48px]">
                  {String(c).slice(0, 6)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className="pr-1 text-slate-500 font-normal capitalize truncate max-w-[48px]">
                  {classes ? String(classes[ri]).slice(0, 6) : `R${ri}`}
                </td>
                {row.map((val, ci) => {
                  const intensity = val / maxVal;
                  const bg = ri === ci
                    ? `rgba(34, 197, 94, ${0.1 + intensity * 0.5})`
                    : `rgba(239, 68, 68, ${intensity * 0.4})`;
                  return (
                    <td
                      key={ci}
                      className="text-center font-mono px-1 py-1 rounded"
                      style={{ background: bg, color: val > 0 ? '#e2e8f0' : '#475569' }}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Feature importance horizontal bars */
function FeatureImportance({ importance }) {
  if (!importance || Object.keys(importance).length === 0) return null;
  const sorted = Object.entries(importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div className="mt-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Feature Importance</p>
      <div className="space-y-1.5">
        {sorted.map(([name, val]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-28 truncate shrink-0">{name.replace(/_/g, ' ')}</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-400/60"
                style={{ width: `${(val / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{(val * 100).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const METRIC_COLORS = {
  Accuracy:   'linear-gradient(90deg, #22c55e, #4ade80)',
  Precision:  'linear-gradient(90deg, #f97316, #fb923c)',
  Recall:     'linear-gradient(90deg, #38bdf8, #7dd3fc)',
  'F1 Score': 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
  'CV Score': 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
};

export function ModelMetrics({ metrics }) {
  const metricRows = [
    { label: 'Accuracy',  value: metrics?.accuracy  },
    { label: 'Precision', value: metrics?.precision },
    { label: 'Recall',    value: metrics?.recall    },
    { label: 'F1 Score',  value: metrics?.f1Score   },
    { label: 'CV Score',  value: metrics?.cvScore   },
  ];

  const radarData = metricRows.map(m => ({
    metric: m.label,
    value: Math.round((m.value ?? 0) * 100),
  }));

  const hasData = metricRows.some(m => (m.value ?? 0) > 0);

  return (
    <GlassCard className="flex flex-col gap-4" accent="#a78bfa">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-purple-400/70" />
        <span className="text-sm font-semibold text-slate-200">Model Performance</span>
        {!hasData && (
          <span className="ml-auto text-[10px] text-slate-600">Run retrain to populate</span>
        )}
      </div>

      {/* Radar chart */}
      {hasData && (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="65%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                dataKey="value"
                stroke="rgba(167,139,250,0.6)"
                fill="rgba(167,139,250,0.12)"
                strokeWidth={1.5}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                formatter={(v) => [`${v}%`, '']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Progress bars */}
      <div className="space-y-2.5">
        {metricRows.map((m) => (
          <MetricBar
            key={m.label}
            label={m.label}
            value={m.value}
            color={METRIC_COLORS[m.label]}
          />
        ))}
      </div>

      {/* Confusion matrix */}
      {metrics?.confusionMatrix && (
        <ConfusionMatrix
          matrix={metrics.confusionMatrix}
          classes={metrics.classes}
        />
      )}

      {/* Feature importance */}
      {metrics?.featureImportance && (
        <FeatureImportance importance={metrics.featureImportance} />
      )}
    </GlassCard>
  );
}
