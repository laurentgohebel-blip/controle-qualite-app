import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

// ---- camelCase <-> snake_case ----
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

export function fromDb<T = any>(row: any): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = {};
  for (const k in row) out[toCamel(k)] = row[k];
  delete out.createdAt;
  return out;
}
export function toDb(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const k in obj) {
    if (k === 'createdAt') continue;
    out[toSnake(k)] = obj[k];
  }
  return out;
}

const TABLES = ['sites', 'locaux', 'criteres', 'agents', 'controles', 'resultats', 'actions', 'site_viewers', 'templates'] as const;
export type TableName = typeof TABLES[number];

export async function fetchAll() {
  const out: Record<string, any[]> = {};
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) throw error;
    out[t] = (data || []).map((r) => fromDb(r));
  }
  return out as Record<TableName, any[]>;
}

export async function upsertRow(table: TableName, row: any) {
  const { error } = await supabase.from(table).upsert(toDb(row));
  if (error) throw error;
}

export async function upsertMany(table: TableName, rows: any[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows.map(toDb));
  if (error) throw error;
}

export async function deleteRow(table: TableName, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}
