// app/(tabs)/progress.tsx
import AverageCard from '@/components/food-average-card';
import MacroTrendsChart from '@/components/macro-trends-chart';
import NutritionTable from '@/components/nutrition-table';
import { supabase } from '@/lib/supabase';
import { fetchMyNutritionLogs, NutritionLog } from '@/services/nutrition';
import { useTheme } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function ProgressScreen() {
  const [items, setItems] = useState<NutritionLog[] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tableOpen, setTableOpen] = useState<boolean>(true);      // table expanded/collapsed
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(7);  // chart window

  const { colors, dark } = useTheme();
  const screenBg = colors.background;
  const textColor = colors.text;
  const subText = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? '#202632' : '#e5e7eb';
  const panel = dark ? '#0f1216' : '#ffffff';
  const primary = colors.primary;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) { setErrorText('Not signed in'); setItems([]); }
        return;
      }
      try {
        const rows = await fetchMyNutritionLogs({ limit: 730 }); // ~2 years
        if (mounted) setItems(rows);
      } catch (e: any) {
        if (mounted) { setErrorText(String(e?.message ?? e)); setItems([]); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const latest = items?.[0] ?? null;

  // 7-day average (unchanged)
  const avg7 = useMemo(() => {
    if (!items?.length) return null;
    const last7 = items.slice(0, 7);
    const n = last7.length;
    const sums = last7.reduce(
      (acc, r) => ({
        calories: acc.calories + (r.calories ?? 0),
        carbs:    acc.carbs    + (r.carbohydrate ?? 0),
        fat:      acc.fat      + (r.fat ?? 0),
        protein:  acc.protein  + (r.protein ?? 0),
      }),
      { calories: 0, carbs: 0, fat: 0, protein: 0 }
    );
    return {
      calories: Math.round(sums.calories / n),
      carbs: (sums.carbs / n).toFixed(1),
      fat: (sums.fat / n).toFixed(1),
      protein: (sums.protein / n).toFixed(1),
    };
  }, [items]);

  // chart data limited by window (oldest → newest)
  const chartData = useMemo(() => {
    if (!items?.length) return [];
    const oldestToNewest = [...items].reverse();
    const slice = oldestToNewest.slice(-windowDays);
    return slice.map(r => ({ date: r.log_date, calories: r.calories ?? 0 }));
  }, [items, windowDays]);

  // flattening per window for MacroTrendsChart
  const chartPropsForWindow = (n: 7 | 30 | 90) => {
    if (n === 7)  return { scale: 'percentile' as const, lowerPct: 15, upperPct: 85, smooth: 3, tickCount: 4 };
    if (n === 30) return { scale: 'percentile' as const, lowerPct: 10, upperPct: 90, smooth: 2, tickCount: 4 };
    return          { scale: 'minmax'     as const,                           smooth: 1, tickCount: 5 };
  };

  const isLoading = items === null;
  const isEmpty = Array.isArray(items) && items.length === 0;

  if (isLoading) {
    return <Centered bg={screenBg}><ActivityIndicator /></Centered>;
  }
  if (errorText) {
    return (
      <Centered bg={screenBg}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: textColor }}>
          {`Could not load nutrition logs:\n${errorText}`}
        </Text>
      </Centered>
    );
  }
  if (isEmpty) {
    return (
      <Centered bg={screenBg}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: textColor }}>
          No nutrition logs yet. Import your CSV or add today’s entry.
        </Text>
      </Centered>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', color: subText, marginBottom: 4 }}>
          Last Food Log
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginBottom: 8 }}>
          {latest ? new Date(latest.log_date).toDateString() : '—'}
        </Text>
      </View>

      {/* Average card (tighter spacing) */}
      {avg7 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <AverageCard calories={avg7.calories} carbs={avg7.carbs} fat={avg7.fat} protein={avg7.protein} />
        </View>
      )}

      {/* Chart + window filters (tighter to show more table rows) */}
      {chartData.length > 1 && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 6,
            padding: 10,
            borderRadius: 12,
            backgroundColor: panel,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          {/* Filters */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            {[7, 30, 90].map(n => {
              const active = windowDays === (n as 7 | 30 | 90);
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setWindowDays(n as 7 | 30 | 90)}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: active ? primary : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? primary : border,
                  }}
                >
                  <Text style={{ color: active ? '#fff' : textColor, fontWeight: '700', fontSize: 12 }}>
                    {n} days
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <MacroTrendsChart
            data={chartData}
            height={120} // ↓ shorter to expose more table rows
            {...chartPropsForWindow(windowDays)}
          />
        </View>
      )}

      {/* Table with sticky internal toggle */}
<NutritionTable
  items={items!}
  expanded={tableOpen}
  onToggle={() => setTableOpen(v => !v)}
/>
    </View>
  );
}

/* helpers */
function Centered({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {children}
    </View>
  );
}
