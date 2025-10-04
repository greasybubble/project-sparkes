// services/weight.ts
import { supabase } from '@/lib/supabase';

export type WeightLog = {
  client_id: string;
  log_date: string;   // 'YYYY-MM-DD'
  weight: number | null;
  id?: number;
};

export async function fetchMyWeightLogs(opts?: { limit?: number }): Promise<WeightLog[]> {
  const { limit = 730 } = opts ?? {};
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('weight_log')
    .select('id, client_id, log_date, weight')
    .eq('client_id', session.user.id)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WeightLog[];
}
