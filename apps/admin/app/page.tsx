'use client';

import { useEffect, useState } from 'react';
import { Activity, ListChecks, MapPin, TicketCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { countRows, isSupabaseConfigured, supabase } from '@/lib/supabase';

interface Stats {
  players: number | null;
  stationsNyc: number | null;
  stationsShanghai: number | null;
  stationsGeneric: number | null;
  activeTasks: number | null;
  redeemedCodes: number | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    players: null,
    stationsNyc: null,
    stationsShanghai: null,
    stationsGeneric: null,
    activeTasks: null,
    redeemedCodes: null,
  });
  const [recentCodes, setRecentCodes] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      const [players, nyc, sh, gn, tasks, redeemed] = await Promise.all([
        countRows('profiles'),
        countRows('stations', { column: 'city', value: 'NYC' }),
        countRows('stations', { column: 'city', value: 'Shanghai' }),
        countRows('stations', { column: 'city', value: 'Generic' }),
        countRows('tasks', { column: 'is_active', value: true }),
        countRows('promo_codes', { column: 'is_redeemed', value: true }),
      ]);
      setStats({
        players,
        stationsNyc: nyc,
        stationsShanghai: sh,
        stationsGeneric: gn,
        activeTasks: tasks,
        redeemedCodes: redeemed,
      });

      if (supabase) {
        const { count } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .gte('checked_in_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
        setRecentCodes(count ?? 0);
      }
    })();
  }, []);

  const fmt = (v: number | null) => (v === null ? '—' : v.toLocaleString());

  const cards = [
    { title: 'Total Players', value: fmt(stats.players), icon: Users, note: 'registered profiles' },
    {
      title: 'Total Stations',
      value: fmt(
        stats.stationsNyc !== null && stats.stationsShanghai !== null && stats.stationsGeneric !== null
          ? stats.stationsNyc + stats.stationsShanghai + stats.stationsGeneric
          : null,
      ),
      icon: MapPin,
      note: `NYC ${fmt(stats.stationsNyc)} · SH ${fmt(stats.stationsShanghai)} · GEN ${fmt(stats.stationsGeneric)}`,
    },
    { title: 'Active Tasks', value: fmt(stats.activeTasks), icon: ListChecks, note: 'daily / weekly / monthly' },
    { title: 'Codes Redeemed', value: fmt(stats.redeemedCodes), icon: TicketCheck, note: 'scratch-off physical packs' },
    { title: 'Check-ins (24h)', value: fmt(recentCodes), icon: Activity, note: 'station visits, last day' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview of the MetroApp game network.
          </p>
        </div>
        <Badge tone={isSupabaseConfigured ? 'green' : 'gold'}>
          {isSupabaseConfigured ? 'Connected' : 'Demo mode'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, value, icon: Icon, note }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Apply the SQL migration in <code className="text-foreground">supabase/migrations</code> to your project.</li>
            <li>Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
            <li>Seed stations via the Station Manager, build tasks in the Task Builder.</li>
            <li>Generate scratch codes and print them inside physical card packs.</li>
            <li>Deploy <code className="text-foreground">verify-task</code> and set the <code className="text-foreground">GEMINI_API_KEY</code> secret.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
