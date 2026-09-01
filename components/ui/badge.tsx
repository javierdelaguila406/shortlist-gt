import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  success: 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40',
  warning: 'bg-amber-900/30 text-amber-300 border border-amber-800/40',
  destructive: 'bg-rose-900/30 text-rose-300 border border-rose-800/40',
  info: 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/40',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1
        text-xs font-medium rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

export function MedalBadge({ place }: { place: 1 | 2 | 3 }) {
  const medals = {
    1: { emoji: '🥇', label: '1er lugar', color: 'bg-yellow-900/40 border-yellow-800/40' },
    2: { emoji: '🥈', label: '2do lugar', color: 'bg-slate-800 border-slate-700' },
    3: { emoji: '🥉', label: '3er lugar', color: 'bg-orange-900/40 border-orange-800/40' },
  };

  const medal = medals[place];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${medal.color}`}>
      <span className="text-lg">{medal.emoji}</span>
      <span className="text-xs font-semibold text-zinc-200">{medal.label}</span>
    </div>
  );
}
