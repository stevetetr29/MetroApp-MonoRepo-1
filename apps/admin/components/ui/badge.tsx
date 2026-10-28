import * as React from 'react';
import { cn } from '@/lib/utils';

const toneClasses: Record<string, string> = {
  default: 'bg-primary/15 text-primary border-primary/30',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function Badge({
  className,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
