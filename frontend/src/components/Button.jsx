import React from 'react';
import { cn } from '../utils/cn';

const variants = {
  ghost:   'bg-white/4 hover:bg-white/8 border-white/8 hover:border-white/15 text-slate-300 hover:text-white',
  green:   'bg-green-500/10 hover:bg-green-500/18 border-green-500/20 hover:border-green-500/40 text-green-400',
  orange:  'bg-orange-500/10 hover:bg-orange-500/18 border-orange-500/20 hover:border-orange-500/40 text-orange-400',
  red:     'bg-red-500/10 hover:bg-red-500/18 border-red-500/20 hover:border-red-500/40 text-red-400',
  white:   'bg-white/8 hover:bg-white/14 border-white/15 hover:border-white/25 text-white',
  // legacy aliases kept for backward compat
  primary:   'bg-white/6 hover:bg-white/10 border-white/10 hover:border-white/20 text-slate-200 hover:text-white',
  secondary: 'bg-white/4 hover:bg-white/8 border-white/8 hover:border-white/15 text-slate-400 hover:text-slate-200',
  danger:    'bg-red-500/10 hover:bg-red-500/18 border-red-500/20 hover:border-red-500/40 text-red-400',
  success:   'bg-green-500/10 hover:bg-green-500/18 border-green-500/20 hover:border-green-500/40 text-green-400',
};

export function Button({ children, onClick, variant = 'ghost', className, icon: Icon, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium',
        'rounded-xl border backdrop-blur-sm transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant] ?? variants.ghost,
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}
