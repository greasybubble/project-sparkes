// app/(tabs)/progress.tsx
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import type { TextStyle } from 'react-native';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MacroTrendsChart from '@/components/macro-trends-chart';
import SegmentedTabs from '@/components/segmented-tabs';
import { supabase } from '@/lib/supabase';
import { fetchMyNutritionLogs, NutritionLog } from '@/services/nutrition';


/* ───────────────────────────────── helpers ───────────────────────────────── */

function toYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}
function getISOWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week decides the year.
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/* ──────────────────────────────── component ──────────────────────────────── */

export default function ProgressScreen() {
  const { colors, dark } = useTheme();
  const [items, setItems] = useState<NutritionLog[] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // 0 = Fitness, 1 = Weight, 2 = Nutrition
  const [tabIndex, setTabIndex] = useState<0 | 1 | 2>(2);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(7);

  const screenBg = colors.background;
  const textColor = colors.text;
  const subText = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? '#202632' : '#e5e7eb';
  const panel = dark ? '#0f1216' : '#ffffff';
  const primary = colors.primary;

  // Load nutrition logs
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (mounted) { setErrorText('Not signed in'); setItems([]); } return; }
      try {
        const rows = await fetchMyNutritionLogs({ limit: 730 });
        if (mounted) setItems(rows);
      } catch (e: any) {
        if (mounted) { setErrorText(String(e?.message ?? e)); setItems([]); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const latest = items?.[0] ?? null;

  // 7-day average
  const avg7 = useMemo(() => {
    if (!items?.length) return null;
    const slice = items.slice(0, 7);
    const n = slice.length || 1;
    const s = slice.reduce(
      (a, r) => ({
        cals: a.cals + (r.calories ?? 0),
        carbs: a.carbs + (r.carbohydrate ?? 0),
        fat: a.fat + (r.fat ?? 0),
        protein: a.protein + (r.protein ?? 0),
      }),
      { cals: 0, carbs: 0, fat: 0, protein: 0 }
    );
    return {
      calories: Math.round(s.cals / n),
      carbs: +(s.carbs / n).toFixed(1),
      fat: +(s.fat / n).toFixed(1),
      protein: +(s.protein / n).toFixed(1),
    };
  }, [items]);

  // Chart data
  const chartData = useMemo(() => {
    if (!items?.length) return [];
    const oldestToNewest = [...items].reverse();
    const slice = oldestToNewest.slice(-windowDays);
    return slice.map(r => ({ date: r.log_date, calories: r.calories ?? 0 }));
  }, [items, windowDays]);

  const chartPropsForWindow = (n: 7 | 30 | 90) => {
    if (n === 7)  return { scale: 'percentile' as const, lowerPct: 15, upperPct: 85, smooth: 3, tickCount: 4 };
    if (n === 30) return { scale: 'percentile' as const, lowerPct: 10, upperPct: 90, smooth: 2, tickCount: 4 };
    return          { scale: 'minmax'     as const,                           smooth: 1, tickCount: 5 };
  };

  if (items === null) return <Center bg={screenBg}><ActivityIndicator /></Center>;
  if (errorText) return <Center bg={screenBg}><Text style={{ color: textColor, textAlign: 'center' }}>{errorText}</Text></Center>;

  const todayStr = new Date().toDateString();
  const headers = [
    { title: 'LAST ACTIVITY', date: todayStr },
    { title: 'LAST WEIGH-IN', date: todayStr },
    { title: 'LAST FOOD LOG', date: latest?.log_date ? new Date(latest.log_date).toDateString() : '—' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      {/* Top banner above tabs (always visible) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', color: subText, marginBottom: 4 }}>
          {headers[tabIndex].title}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginBottom: 8 }}>
          {headers[tabIndex].date}
        </Text>
      </View>

      {/* Segmented tabs (always visible) */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SegmentedTabs
          tabs={['Fitness', 'Weight', 'Nutrition']}
          value={tabIndex}
          onChange={(i) => setTabIndex(i as 0 | 1 | 2)}
        />
      </View>

      {/* Bodies */}
      {tabIndex === 0 && (
        <Card panel={panel} border={border}>
          <Text style={{ color: textColor, fontWeight: '700' }}>Fitness Overview</Text>
          <Text style={{ color: subText, marginTop: 6 }}>Drop your widgets here.</Text>
        </Card>
      )}

      {tabIndex === 1 && (
        <Card panel={panel} border={border}>
          <Text style={{ color: textColor, fontWeight: '700' }}>Weight Trends</Text>
          <Text style={{ color: subText, marginTop: 6 }}>Bodyweight chart coming soon.</Text>
        </Card>
      )}

      {tabIndex === 2 && (
        // One scroller: Avg card + Chart + Table sections
        <SectionList
          sections={groupByWeek(items)}
          keyExtractor={(item) => item.log_date}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View>
              {/* 7-day average card */}
              {avg7 && (
                <Card panel={panel} border={border} style={{ marginBottom: 10 }}>
                  <Text style={{ color: subText, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8 }}>
                    7 DAY AVERAGE
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 30, fontWeight: '900', color: textColor, lineHeight: 34 }}>{avg7.calories}</Text>
                      <Text style={{ marginTop: 2, color: subText, fontSize: 14, fontWeight: '700' }}>kcal</Text>
                    </View>
                    <View style={{ flex: 1.2, gap: 6 }}>
                      <MacroLine label="CARBS" value={`${avg7.carbs} g`} accent={primary} sub={subText} />
                      <MacroLine label="FAT" value={`${avg7.fat} g`} accent={primary} sub={subText} />
                      <MacroLine label="PROTEIN" value={`${avg7.protein} g`} accent={primary} sub={subText} />
                    </View>
                  </View>
                </Card>
              )}

              {/* Chart + range toggles */}
              <Card panel={panel} border={border}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                  {[7, 30, 90].map(n => {
                    const active = windowDays === (n as 7 | 30 | 90);
                    return (
                      <View
                        key={n}
                        style={{
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: active ? primary : 'transparent',
                          borderWidth: 1,
                          borderColor: active ? primary : border,
                          marginHorizontal: 3,
                        }}
                      >
                        <Text
                          onPress={() => setWindowDays(n as 7 | 30 | 90)}
                          style={{ color: active ? '#fff' : textColor, fontWeight: '700', fontSize: 12 }}
                        >
                          {n} days
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <MacroTrendsChart data={chartData} height={120} {...chartPropsForWindow(windowDays)} />
              </Card>

              {/* Table heading */}
              <Card panel={panel} border={border} style={{ marginTop: 10, paddingVertical: 10 }}>
                <Text style={{ color: textColor, fontWeight: '800', fontSize: 16 }}>Nutrition Table</Text>
                <View style={{ height: 10 }} />
                <HeaderRow text={textColor} />
              </Card>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View
              style={{
                backgroundColor: panel,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: border,
              }}
            >
              <Text style={{ fontWeight: '700', color: subText }}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Row
              calories={item.calories ?? 0}
              carbs={item.carbohydrate ?? 0}
              fat={item.fat ?? 0}
              protein={item.protein ?? 0}
              text={textColor}
              border={border}
            />
          )}
        />
      )}
    </View>
  );
}

/* ───────────────────────── Nutrition table bits ─────────────────────────── */

function groupByWeek(items: NutritionLog[] | null) {
  if (!items?.length) return [];
  const groups = new Map<string, NutritionLog[]>();
  for (const r of items) {
    const d = new Date(r.log_date);
    const key = `${d.getUTCFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries()).map(([key, rows]) => {
    const first = rows[rows.length - 1];
    const start = startOfISOWeek(new Date(first.log_date));
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
    const title = `Week ${key.split('W')[1]}: ${toYMD(start)} → ${toYMD(end)}`;
    return { title, data: rows };
  });
}

function HeaderRow({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 16 }}>
      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: text, fontWeight: '800' }}>Calories</Text>
      </Cell>
      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: text, fontWeight: '800' }}>Carbs (g)</Text>
      </Cell>
      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: text, fontWeight: '800' }}>Fat (g)</Text>
      </Cell>
      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: text, fontWeight: '800' }}>Protein (g)</Text>
      </Cell>
    </View>
  );
}

function Row({
  calories, carbs, fat, protein, text, border,
}: {
  calories: number; carbs: number; fat: number; protein: number; text: string; border: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: border,
      }}
    >
      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text numberOfLines={1} ellipsizeMode="clip" style={numStyle(text)}>
          {Math.round(calories)}
        </Text>
      </Cell>

      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text numberOfLines={1} ellipsizeMode="clip" style={numStyle(text)}>
          {carbs.toFixed(1)}
        </Text>
      </Cell>

      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text numberOfLines={1} ellipsizeMode="clip" style={numStyle(text)}>
          {fat.toFixed(1)}
        </Text>
      </Cell>

      <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text numberOfLines={1} ellipsizeMode="clip" style={numStyle(text)}>
          {protein.toFixed(1)}
        </Text>
      </Cell>
    </View>
  );
}

// Patch 1 + 2: numeric text style (typed so TS is happy) and no wrapping
const numStyle = (color: string): TextStyle => ({
  color,
  textAlign: 'right',
  fontVariant: ['tabular-nums'] as NonNullable<TextStyle['fontVariant']>,
  includeFontPadding: false,
});

// Patch 3: consistent cell sizing (prevents squashing on narrow screens)
function Cell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          minHeight: 20,
          minWidth: 64, // helps columns stay tidy on small phones
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ──────────────────────────────── small bits ─────────────────────────────── */

function Card({
  children,
  panel,
  border,
  style,
}: {
  children: React.ReactNode;
  panel: string;
  border: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          marginHorizontal: 16,
          marginBottom: 10,
          padding: 14,
          borderRadius: 12,
          backgroundColor: panel,
          borderWidth: 1,
          borderColor: border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Center({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function MacroLine({ label, value, accent, sub }: { label: string; value: string; accent: string; sub: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: accent, fontVariant: ['tabular-nums'] as NonNullable<TextStyle['fontVariant']> }}>
        {value}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: sub }}>{label}</Text>
    </View>
  );
}
