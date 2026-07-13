import React from 'react';
import { cn } from '../utils/cn';

export function GlassCard({ children, className, accent }) {
  return (
    <div
      className={cn(
        'glass glass-inset relative overflow-hidden p-5',
        className
      )}
      style={accent ? { borderColor: `${accent}22` } : undefined}
    >
      {/* Subtle top-edge highlight line */}
      <div
        className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
        style={{
          background: accent
            ? `linear-gradient(90deg, transparent, ${accent}40, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
