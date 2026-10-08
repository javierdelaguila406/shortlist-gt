import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card text-card-foreground shadow-sm sm:max-h-[90dvh] sm:rounded-2xl',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  id,
  title,
  description,
  onClose,
  closeLabel = 'Cerrar',
  children,
}: {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-5">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex-1 overflow-y-auto p-4 sm:p-5', className)}>{children}</div>;
}

export function ModalFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-wrap justify-end gap-2 border-t p-4 sm:p-5', className)}>{children}</div>;
}
