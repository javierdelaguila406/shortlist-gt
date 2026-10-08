import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'destructive' | 'success' | 'info' | 'warning';

const styles: Record<AlertVariant, { box: string; icon: React.ElementType; iconColor: string }> = {
  destructive: { box: 'bg-destructive/10 ring-destructive/25', icon: AlertCircle, iconColor: 'text-destructive' },
  success: { box: 'bg-success-soft ring-success/25', icon: CheckCircle2, iconColor: 'text-success' },
  info: { box: 'bg-info-soft ring-info/25', icon: Info, iconColor: 'text-info' },
  warning: { box: 'bg-warning-soft ring-warning/25', icon: TriangleAlert, iconColor: 'text-warning' },
};

export function Alert({
  variant = 'info',
  children,
  className,
  role,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}) {
  const { box, icon: Icon, iconColor } = styles[variant];
  return (
    <div
      role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
      className={cn('flex gap-3 rounded-lg p-3 text-sm text-foreground ring-1 ring-inset', box, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', iconColor)} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
