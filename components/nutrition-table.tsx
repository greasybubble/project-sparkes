// components/nutrition-table.tsx
import type { NutritionLog } from '@/services/nutrition';
import { useTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

/* ---------- helpers ---------- */
const MS_DAY = 86400000;

function startOfISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}
function getISOWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7)); // Thursday rule
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / MS_DAY) + 1) / 7);
}
function fmtRange(start: Date) {
  const end = new Date(start.getTime() + 6 * MS_DAY);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  return `${fmt(start)} → ${fmt(end)}`;
}
function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue, ...
}

/* ---------- component ---------- */
export default function NutritionTable({ items }: { items: NutritionLog[] }) {
  const { colors, dark } = useTheme();
  const border = dark ? '#2a2f3a' : '#e5e7eb';
  const rowAlt = dark ? '#0b0f14' : '#f8fafc';
  const card = dark ? '#0f1216' : '#ffffff';
  const sub = dark ? '#a3aab6' : '#64748b';
  const text = colors.text;
  const accent = colors.primary;

  const sections = useMemo(() => {
    // newest-first weeks
    const byWeek = new Map<string, NutritionLog[]>();
    for (const r of items) {
      const d = new Date(r.log_date);
      const weekKey = `${d.getUTCFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`;
      if (!byWeek.has(weekKey)) byWeek.set(weekKey, []);
      byWeek.get(weekKey)!.push(r);
    }
    const entries = Array.from(byWeek.entries());
    entries.sort(([a], [b]) => (a > b ? -1 : 1));
    return entries.map(([key, rows]) => {
      // sort within week by date ascending (Mon..Sun) to mimic your screenshot
      rows.sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
      const first = rows[0];
      const start = startOfISOWeek(new Date(first.log_date));
      const title = `Week ${key.split('W')[1]}: ${fmtRange(start)}`;
      return { key, title, data: rows };
    });
  }, [items]);

  const HeaderRow = () => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border }}>
      <Cell text="Day" style={{ flex: 1 }} bold subColour={sub} />
      <Cell text="Calories" style={{ width: 90, textAlign: 'right' }} bold subColour={sub} />
      <Cell text="Carbs (g)" style={{ width: 90, textAlign: 'right' }} bold subColour={sub} />
      <Cell text="Fat (g)" style={{ width: 80, textAlign: 'right' }} bold subColour={sub} />
      <Cell text="Protein (g)" style={{ width: 100, textAlign: 'right' }} bold subColour={sub} />
    </View>
  );

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: card,
        borderWidth: 1,
        borderColor: border,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: text }}>Nutrition Table</Text>
      </View>

      <HeaderRow />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id?.toString() ?? item.log_date}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: card, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border }}>
            <Text style={{ fontWeight: '700', color: text }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const d = new Date(item.log_date);
          const alt = index % 2 === 1;
          return (
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: alt ? rowAlt : card }}>
              <Cell text={dayLabel(d)} style={{ flex: 1, color: text }} />
              <Cell text={`${(item.calories ?? 0).toFixed(0)}`} style={{ width: 90, textAlign: 'right', color: text }} />
              <Cell text={`${(item.carbohydrate ?? 0).toFixed(1)}`} style={{ width: 90, textAlign: 'right', color: text }} />
              <Cell text={`${(item.fat ?? 0).toFixed(1)}`} style={{ width: 80, textAlign: 'right', color: text }} />
              <Cell text={`${(item.protein ?? 0).toFixed(1)}`} style={{ width: 100, textAlign: 'right', color: text }} />
            </View>
          );
        }}
        renderSectionFooter={({ section }) => {
          // weekly averages
          const rows = section.data;
          const n = rows.length || 1;
          const sum = rows.reduce(
            (a, r) => ({
              c: a.c + (r.calories ?? 0),
              carb: a.carb + (r.carbohydrate ?? 0),
              f: a.f + (r.fat ?? 0),
              p: a.p + (r.protein ?? 0),
            }),
            { c: 0, carb: 0, f: 0, p: 0 }
          );
          const avg = {
            c: Math.round(sum.c / n),
            carb: +(sum.carb / n).toFixed(1),
            f: +(sum.f / n).toFixed(1),
            p: +(sum.p / n).toFixed(1),
          };
          return (
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border, backgroundColor: card }}>
              <Cell text=" " style={{ flex: 1, color: sub }} />
              <Cell text={`${avg.c}`} style={{ width: 90, textAlign: 'right', color: accent, fontWeight: '800' }} />
              <Cell text={`${avg.carb}`} style={{ width: 90, textAlign: 'right', color: accent, fontWeight: '800' }} />
              <Cell text={`${avg.f}`} style={{ width: 80, textAlign: 'right', color: accent, fontWeight: '800' }} />
              <Cell text={`${avg.p}`} style={{ width: 100, textAlign: 'right', color: accent, fontWeight: '800' }} />
            </View>
          );
        }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ color: sub }}>No rows yet.</Text>
          </View>
        }
      />
    </View>
  );
}

function Cell({ text, style, bold, subColour }: { text: string; style?: any; bold?: boolean; subColour?: string }) {
  return (
    <Text
      style={[
        { fontSize: 14, fontWeight: bold ? '800' : '600', color: subColour },
        style,
      ]}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}
