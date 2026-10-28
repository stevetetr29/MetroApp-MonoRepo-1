'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Download, RefreshCw, Ticket } from 'lucide-react';
import type { Card as GameCard, PromoCode } from '@metro/shared';
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
import { generatePromoCode, toCsv } from '@/lib/utils';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function CodesPage() {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [cardId, setCardId] = useState('');
  const [batchSize, setBatchSize] = useState('50');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data: cardRows }, { data: codeRows }] = await Promise.all([
      supabase.from('cards').select('*').order('rarity'),
      supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    if (cardRows) {
      setCards(cardRows as GameCard[]);
      if (!cardId && cardRows.length > 0) setCardId((cardRows[0] as GameCard).id);
    }
    if (codeRows) setCodes(codeRows as PromoCode[]);
  }, [cardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cardName = useMemo(() => {
    const map = new Map(cards.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? 'Unknown card';
  }, [cards]);

  const generate = async () => {
    const count = Number(batchSize);
    if (!Number.isInteger(count) || count < 1 || count > 5000) {
      setMessage('Batch size must be 1–5000.');
      return;
    }
    if (!cardId) {
      setMessage('Select a card first.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase is not configured — cannot save codes.');
      return;
    }

    setGenerating(true);
    // Generate unique codes, retrying once on a (very unlikely) DB unique collision.
    const fresh = new Set<string>();
    while (fresh.size < count) fresh.add(generatePromoCode());
    const rows = Array.from(fresh).map((code) => ({ code, card_id: cardId }));
    const { error } = await supabase.from('promo_codes').insert(rows);
    if (error) {
      // Collision or partial failure — retry each row individually.
      const inserted: string[] = [];
      for (const row of rows) {
        const { error: rowErr } = await supabase
          .from('promo_codes')
          .insert({ code: generatePromoCode(), card_id: cardId });
        if (!rowErr) inserted.push(row.card_id);
      }
      setMessage(
        inserted.length > 0
          ? `Inserted ${inserted.length}/${count} codes (some collisions regenerated).`
          : `Insert failed: ${error.message}`,
      );
    } else {
      setMessage(`Generated ${count} scratch codes for ${cardName(cardId)}.`);
    }
    setLastBatch(Array.from(fresh));
    setGenerating(false);
    void load();
  };

  const exportCsv = () => {
    const rows = [
      ['code', 'card_id', 'card_name', 'is_redeemed'],
      ...codes.map((c) => [c.code, c.card_id, cardName(c.card_id), String(c.is_redeemed)]),
    ];
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metroapp-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBatch = async () => {
    if (lastBatch.length === 0) return;
    await navigator.clipboard.writeText(lastBatch.join('\n'));
    setMessage(`Copied ${lastBatch.length} codes to clipboard.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scratch Code Generator</h1>
          <p className="text-sm text-muted-foreground">
            Bulk-generate 8-digit single-use codes printed inside physical card packs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyBatch} disabled={lastBatch.length === 0}>
            <Copy className="h-3.5 w-3.5" /> Copy last batch
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={codes.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Batch</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="cd-card">Card reward</Label>
            <Select id="cd-card" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.rarity})
                </option>
              ))}
              {cards.length === 0 && <option value="">No cards — seed the database first</option>}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cd-count">Batch size</Label>
            <Input
              id="cd-count"
              inputMode="numeric"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
            />
          </div>
          <Button onClick={() => void generate()} disabled={generating || !isSupabaseConfigured}>
            <Ticket className="h-4 w-4" /> {generating ? 'Generating…' : 'Generate Codes'}
          </Button>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Issued Codes ({codes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold tracking-widest">
                    {c.code}
                  </TableCell>
                  <TableCell>{cardName(c.card_id)}</TableCell>
                  <TableCell>
                    <Badge tone={c.is_redeemed ? 'green' : 'muted'}>
                      {c.is_redeemed ? 'Redeemed' : 'Available'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(c as unknown as { created_at?: string }).created_at
                      ? new Date(
                          (c as unknown as { created_at: string }).created_at,
                        ).toLocaleDateString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {isSupabaseConfigured
                      ? 'No codes issued yet.'
                      : 'Connect Supabase to generate codes.'}
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
