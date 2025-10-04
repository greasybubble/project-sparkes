// components/weight-table.tsx
import type { WeightLog } from '@/services/weight';
import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View, type TextStyle } from 'react-native';

function toYMD(d: Date) {
  const y = d.getUTCFullYear(), m = `${d.getUTCMonth()+1}`.padStart(2,'0'), day = `${d.getUTCDate()}`.padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function startOfISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1)); return d;
}
function getISOWeek(date: Date) {
  const t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t.getTime() - ys.getTime())/86400000)+1)/7);
}

const numStyle = (color: string): TextStyle => ({
  color,
  textAlign: 'right',
  fontVariant: ['tabular-nums'] as NonNullable<TextStyle['fontVariant']>,
  includeFontPadding: false,
});

function Cell({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ minHeight: 20, minWidth: 64, justifyContent: 'center' }, style]}>
      {children}
    </View>
  );
}

export default function WeightTable({ items }: { items: WeightLog[] }) {
  const { colors, dark } = useTheme();
  const border = dark ? '#202632' : '#e5e7eb';
  const panel = dark ? '#0f1216' : '#ffffff';
  const sub = dark ? '#9ca3af' : '#6b7280';

  const sections = useMemo(() => {
    if (!items?.length) return [];
    const groups = new Map<string, WeightLog[]>();
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
  }, [items]);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: panel,
        borderWidth: 1,
        borderColor: border,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>Weight Table</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Weight (kg)</Text>
          </Cell>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id?.toString() ?? item.log_date}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: panel, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border }}>
            <Text style={{ fontWeight: '700', color: sub }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border }}>
            <Cell style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text numberOfLines={1} ellipsizeMode="clip" style={numStyle(colors.text)}>
                {(item.weight ?? 0).toFixed(1)}
              </Text>
            </Cell>
          </View>
        )}
        ListEmptyComponent={<View style={{ padding: 16 }}><Text style={{ color: sub }}>No weigh-ins yet.</Text></View>}
      />
    </View>
  );
}
