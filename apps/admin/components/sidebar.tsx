'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, MapPin, Ticket, TrainFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stations', label: 'Stations', icon: MapPin },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/codes', label: 'Scratch Codes', icon: Ticket },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrainFront className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">MetroApp</p>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4">
        <p
          className={cn(
            'rounded-md border px-3 py-2 text-xs',
            isSupabaseConfigured
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          )}
        >
          {isSupabaseConfigured
            ? 'Supabase connected'
            : 'Supabase not configured — read-only preview'}
        </p>
      </div>
    </aside>
  );
}
