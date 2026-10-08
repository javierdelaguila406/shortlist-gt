import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-muted text-muted-foreground ring-border',
  success: 'bg-success-soft text-success ring-success/25',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  destructive: 'bg-destructive/10 text-destructive ring-destructive/25',
  info: 'bg-info-soft text-info ring-info/25',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function MedalBadge({ place }: { place: 1 | 2 | 3 }) {
  const medals = {
    1: { emoji: '🥇', label: '1er lugar', color: 'bg-warning-soft' },
    2: { emoji: '🥈', label: '2do lugar', color: 'bg-muted' },
    3: { emoji: '🥉', label: '3er lugar', color: 'bg-muted' },
  };

  const medal = medals[place];

  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5', medal.color)}>
      <span className="text-lg" aria-hidden="true">{medal.emoji}</span>
      <span className="text-xs font-semibold text-foreground">{medal.label}</span>
    </div>
  );
}
