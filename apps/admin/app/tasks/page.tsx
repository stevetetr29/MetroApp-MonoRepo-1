'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, Footprints, HelpCircle, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import type { City, Task, TaskCadence, TaskType } from '@metro/shared';
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

const TYPE_ICONS: Record<TaskType, typeof Camera> = {
  photo_ai: Camera,
  trivia: HelpCircle,
  step_count: Footprints,
};

interface TaskForm {
  title: string;
  description: string;
  task_type: TaskType;
  ai_prompt_criteria: string;
  points: string;
  cadence: TaskCadence;
  city: City;
  is_rush_hour_only: boolean;
  trivia_options: string;
  trivia_answer_idx: string;
  step_goal: string;
}

const EMPTY_FORM: TaskForm = {
  title: '',
  description: '',
  task_type: 'photo_ai',
  ai_prompt_criteria: '',
  points: '150',
  cadence: 'daily',
  city: 'NYC',
  is_rush_hour_only: false,
  trivia_options: '',
  trivia_answer_idx: '0',
  step_goal: '200',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('cadence')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTasks(
        (data as Record<string, unknown>[]).map((row) => ({
          ...(row as unknown as Task),
          trivia_options: Array.isArray(row.trivia_options)
            ? (row.trivia_options as string[])
            : undefined,
        })),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTask = async () => {
    const points = Number(form.points);
    if (!form.title.trim() || !form.description.trim()) {
      setMessage('Title and description are required.');
      return;
    }
    if (!Number.isFinite(points) || points < 1 || points > 10000) {
      setMessage('Points must be between 1 and 10,000 (recommended 100–500).');
      return;
    }
    if (form.task_type === 'photo_ai' && !form.ai_prompt_criteria.trim()) {
      setMessage('Photo AI tasks require Gemini verification criteria.');
      return;
    }
    let triviaOptions: string[] | undefined;
    let triviaAnswer: number | undefined;
    if (form.task_type === 'trivia') {
      triviaOptions = form.trivia_options
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      triviaAnswer = Number(form.trivia_answer_idx);
      if (triviaOptions.length < 2) {
        setMessage('Trivia needs at least 2 options separated by |');
        return;
      }
      if (!Number.isInteger(triviaAnswer) || triviaAnswer < 0 || triviaAnswer >= triviaOptions.length) {
        setMessage(`Correct answer index must be 0–${triviaOptions.length - 1}.`);
        return;
      }
    }
    let stepGoal: number | undefined;
    if (form.task_type === 'step_count') {
      stepGoal = Number(form.step_goal);
      if (!Number.isInteger(stepGoal) || stepGoal <= 0) {
        setMessage('Step goal must be a positive integer.');
        return;
      }
    }
    if (!supabase) {
      setMessage('Supabase is not configured — cannot save.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      task_type: form.task_type,
      ai_prompt_criteria: form.task_type === 'photo_ai' ? form.ai_prompt_criteria.trim() : null,
      points,
      cadence: form.cadence,
      city: form.city,
      is_rush_hour_only: form.is_rush_hour_only,
      trivia_options: triviaOptions ?? null,
      trivia_answer_idx: triviaAnswer ?? null,
      step_goal: stepGoal ?? null,
    });
    setSaving(false);
    if (error) {
      setMessage(`Save failed: ${error.message}`);
      return;
    }
    setForm(EMPTY_FORM);
    setMessage('Task created.');
    void load();
  };

  const removeTask = async (id: string) => {
    if (!supabase) return;
    // Soft-delete keeps player history consistent.
    const { error } = await supabase.from('tasks').update({ is_active: false }).eq('id', id);
    if (error) setMessage(`Deactivate failed: ${error.message}`);
    else setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Builder</h1>
          <p className="text-sm text-muted-foreground">
            Create photo-AI, trivia, and step-count tasks with Gemini criteria.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="tk-title">Title</Label>
            <Input
              id="tk-title"
              placeholder="Platform Portrait"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tk-type">Type</Label>
            <Select
              id="tk-type"
              value={form.task_type}
              onChange={(e) => setForm({ ...form, task_type: e.target.value as TaskType })}
            >
              <option value="photo_ai">Photo AI (Gemini)</option>
              <option value="trivia">Trivia</option>
              <option value="step_count">Step Count</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tk-points">Points (100–500)</Label>
            <Input
              id="tk-points"
              inputMode="numeric"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-4">
            <Label htmlFor="tk-desc">Description</Label>
            <Input
              id="tk-desc"
              placeholder="Snap a photo of any station name sign…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {form.task_type === 'photo_ai' && (
            <div className="flex flex-col gap-2 md:col-span-4">
              <Label htmlFor="tk-criteria">Gemini verification criteria</Label>
              <Input
                id="tk-criteria"
                placeholder="A photo clearly showing a subway station name sign…"
                value={form.ai_prompt_criteria}
                onChange={(e) => setForm({ ...form, ai_prompt_criteria: e.target.value })}
              />
            </div>
          )}
          {form.task_type === 'trivia' && (
            <>
              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="tk-options">Options (separate with |)</Label>
                <Input
                  id="tk-options"
                  placeholder="8th Avenue Express | Broadway Local | Crosstown"
                  value={form.trivia_options}
                  onChange={(e) => setForm({ ...form, trivia_options: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tk-answer">Correct index</Label>
                <Input
                  id="tk-answer"
                  inputMode="numeric"
                  value={form.trivia_answer_idx}
                  onChange={(e) => setForm({ ...form, trivia_answer_idx: e.target.value })}
                />
              </div>
            </>
          )}
          {form.task_type === 'step_count' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tk-steps">Step goal</Label>
              <Input
                id="tk-steps"
                inputMode="numeric"
                value={form.step_goal}
                onChange={(e) => setForm({ ...form, step_goal: e.target.value })}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tk-cadence">Cadence</Label>
            <Select
              id="tk-cadence"
              value={form.cadence}
              onChange={(e) => setForm({ ...form, cadence: e.target.value as TaskCadence })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tk-city">City</Label>
            <Select
              id="tk-city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value as City })}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <input
              id="tk-rush"
              type="checkbox"
              className="h-4 w-4 accent-blue-500"
              checked={form.is_rush_hour_only}
              onChange={(e) => setForm({ ...form, is_rush_hour_only: e.target.checked })}
            />
            <Label htmlFor="tk-rush">Rush-hour only (7–10 AM / 5–8 PM)</Label>
          </div>
          <div className="flex items-end">
            <Button onClick={() => void createTask()} disabled={saving || !isSupabaseConfigured}>
              <Plus className="h-4 w-4" /> {saving ? 'Saving…' : 'Create Task'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cadence</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => {
                const Icon = TYPE_ICONS[t.task_type] ?? HelpCircle;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone="muted" className="gap-1">
                        {t.task_type}
                        {t.is_rush_hour_only && <Zap className="h-3 w-3 text-amber-400" />}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{t.cadence}</TableCell>
                    <TableCell>{t.city}</TableCell>
                    <TableCell className="font-semibold text-amber-400">+{t.points}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void removeTask(t.id)}
                        disabled={!isSupabaseConfigured}
                        aria-label={`Deactivate ${t.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {isSupabaseConfigured
                      ? 'No tasks yet — create your first one above.'
                      : 'Connect Supabase to manage tasks.'}
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
