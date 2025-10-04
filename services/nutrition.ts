import { supabase } from '@/lib/supabase';

export type NutritionLog = {
  id: number;
  client_id: string;
  coach_id: string | null;
  log_date: string;
  calories: number | null;
  protein: number | null;
  carbohydrate: number | null;
  fat: number | null;
};

export async function fetchMyNutritionLogs(opts?: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  let q = supabase.from('nutrition_log').select('*');

  if (opts?.from) q = q.gte('log_date', opts.from);
  if (opts?.to)   q = q.lte('log_date', opts.to);
  q = q.order('log_date', { ascending: false });
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as NutritionLog[];
}

const NutritionService = { fetchMyNutritionLogs };
export default NutritionService;
