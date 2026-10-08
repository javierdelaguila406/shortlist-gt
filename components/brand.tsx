import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-lg font-semibold tracking-tight', className)}>
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground"
      >
        N
      </span>
      Nuvora
    </span>
  );
}
