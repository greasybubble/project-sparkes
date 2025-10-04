// components/weight-trends-chart.tsx
import MacroTrendsChart from '@/components/macro-trends-chart';

type Row = { date: string; weight: number | null };

export default function WeightTrendsChart({
  rows,
  height = 120,
  props,
}: {
  rows: Row[];
  height?: number;
  props?: Partial<Parameters<typeof MacroTrendsChart>[0]>;
}) {
  // MacroTrendsChart expects { date, calories }, so map weight -> calories key
  const data = rows.map(r => ({ date: r.date, calories: r.weight ?? 0 }));
  return <MacroTrendsChart data={data} height={height} {...props} />;
}
