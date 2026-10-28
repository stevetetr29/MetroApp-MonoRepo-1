import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when real credentials are present — otherwise pages render empty states. */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Safe count helper — returns null when Supabase is unreachable/unconfigured. */
export async function countRows(
  table: string,
  filter?: { column: string; value: string | boolean },
): Promise<number | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    const { count, error } = await query;
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}
