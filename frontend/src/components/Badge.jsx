import React from 'react';
import { cn } from '../utils/cn';

const variants = {
  default:  'bg-white/5   text-slate-400  border-white/10',
  orange:   'bg-orange-500/10 text-orange-400  border-orange-500/20',
  green:    'bg-green-500/10  text-green-400   border-green-500/20',
  red:      'bg-red-500/10    text-red-400     border-red-500/20',
  white:    'bg-white/8       text-white        border-white/15',
  cyan:     'bg-cyan-500/10   text-cyan-400    border-cyan-500/20',
  purple:   'bg-purple-500/10 text-purple-400  border-purple-500/20',
  blue:     'bg-blue-500/10   text-blue-400    border-blue-500/20',
};

export function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
