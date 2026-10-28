'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { City, Station } from '@metro/shared';
import { CITIES } from '@metro/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const EMPTY_FORM = {
  name: '',
  city: 'NYC' as City,
  line_name: '',
  latitude: '',
  longitude: '',
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('city')
      .order('name');
    if (!error && data) setStations(data as Station[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.line_name.toLowerCase().includes(q),
    );
  }, [stations, filter]);

  const addStation = async () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.name.trim() || !form.line_name.trim()) {
      setMessage('Name and line are required.');
      return;
    }
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      setMessage('Enter valid latitude (-90..90) and longitude (-180..180).');
      return;
    }
    if (!supabase) {
      setMessage('Supabase is not configured — cannot save.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('stations').insert({
      name: form.name.trim(),
      city: form.city,
      line_name: form.line_name.trim(),
      latitude: lat,
      longitude: lng,
    });
    setSaving(false);
    if (error) {
      setMessage(`Save failed: ${error.message}`);
      return;
    }
    setForm(EMPTY_FORM);
    setMessage('Station saved.');
    void load();
  };

  const removeStation = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('stations').delete().eq('id', id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else setStations((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Station Manager</h1>
          <p className="text-sm text-muted-foreground">
            Add and edit metro stations for NYC, Shanghai, and Generic maps.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Station</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="st-name">Name</Label>
            <Input
              id="st-name"
              placeholder="Union Square"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="st-city">City</Label>
            <Select
              id="st-city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value as City })}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="st-line">Line</Label>
            <Input
              id="st-line"
              placeholder="L / 4 / 5 / 6"
              value={form.line_name}
              onChange={(e) => setForm({ ...form, line_name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="st-lat">Latitude</Label>
            <Input
              id="st-lat"
              inputMode="decimal"
              placeholder="40.7359"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="st-lng">Longitude</Label>
            <Input
              id="st-lng"
              inputMode="decimal"
              placeholder="-73.9911"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void addStation()} disabled={saving || !isSupabaseConfigured}>
              <Plus className="h-4 w-4" /> {saving ? 'Saving…' : 'Add Station'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stations ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Filter by name, city, or line…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge tone={s.city === 'NYC' ? 'default' : s.city === 'Shanghai' ? 'purple' : 'muted'}>
                      {s.city}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.line_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void removeStation(s.id)}
                      disabled={!isSupabaseConfigured}
                      aria-label={`Delete ${s.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {isSupabaseConfigured
                      ? 'No stations match your filter.'
                      : 'Connect Supabase to manage stations.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
