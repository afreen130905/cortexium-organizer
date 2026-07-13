import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { ScanSearch } from 'lucide-react';

function StatusDot({ status }) {
  if (status === 'Correct') {
    return <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Correct
    </span>;
  }
  return <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium">
    <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Misplaced
  </span>;
}

export function DetectedObjectsTable({ objects }) {
  return (
    <GlassCard className="flex flex-col h-full" accent="#f97316">
      <div className="flex items-center gap-2 mb-4">
        <ScanSearch className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-slate-200">Detected Objects</span>
        {objects?.length > 0 && (
          <span className="ml-auto text-[10px] font-mono bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-slate-400">
            {objects.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {objects?.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-white/5">
                <th className="text-left pb-2 font-medium">Object</th>
                <th className="text-left pb-2 font-medium">Current</th>
                <th className="text-left pb-2 font-medium">Expected</th>
                <th className="text-right pb-2 font-medium">Conf</th>
                <th className="text-right pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {objects.map((obj, i) => (
                <tr key={i} className="fade-in hover:bg-white/2 transition-colors">
                  <td className="py-2.5 pr-2 font-medium text-slate-200 capitalize">{obj.name}</td>
                  <td className="py-2.5 pr-2 text-orange-400/80 capitalize">{obj.currentSurface}</td>
                  <td className="py-2.5 pr-2 text-slate-400 capitalize">{obj.predictedSurface}</td>
                  <td className="py-2.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-400"
                          style={{ width: `${obj.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-400 tabular-nums w-7 text-right">
                        {(obj.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <StatusDot status={obj.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
            <ScanSearch className="w-8 h-8 opacity-30" />
            <p className="text-xs">No objects detected</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
