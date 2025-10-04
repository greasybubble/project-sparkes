// components/nutrition-table.tsx
import type { NutritionLog } from '@/services/nutrition';
import { useTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, SectionList, StyleSheet, Text, View } from 'react-native';

// ---------- helpers ----------
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}
function getISOWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((+tmp - +yearStart) / 86400000) + 1) / 7);
}
function weekLabelParts(date: Date) {
  const start = startOfISOWeek(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' });
  return { week: `Week ${getISOWeek(start)}`, range: `${fmt(start)} - ${fmt(end)}` };
}

const TOPBAR_HEIGHT = 36;
const COLUMNS_HEIGHT = 36;
const HEADER_HEIGHT = TOPBAR_HEIGHT + COLUMNS_HEIGHT;

const fmt1 = (n?: number | null) =>
  n === null || n === undefined ? '-' : Number(n).toFixed(1);
const fmtCal = (n?: number | null) =>
  n === null || n === undefined ? '-' : Math.round(n).toString();

type Row =
  | { kind: 'row'; item: NutritionLog }
  | { kind: 'summary'; avg: { calories: number; protein: number; carbs: number; fat: number; count: number } };

type Section = {
  titleParts: { week: string; range: string };
  data: Row[];
};

export default function NutritionTable({
  items,
  expanded,
  onToggle,
}: {
  items: NutritionLog[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors, dark } = useTheme();

  const pal = useMemo(() => ({
    bg: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    headerBg: dark ? '#0f1216' : '#f8fafc',
    headerText: dark ? '#e5e7eb' : '#0f172a',
    sectionBg: dark ? '#0a0a0a' : '#fafafa',
    sectionWeek: dark ? '#fff' : '#111',
    sectionRange: dark ? '#bbb' : '#6b7280',
    rowBg: dark ? '#000' : '#fff',
    summaryBg: dark ? '#101417' : '#eef6ff',
    summaryText: dark ? '#9fd4ff' : '#0b6bcb',
  }), [colors, dark]);

  const sections = useMemo<Section[]>(() => {
    const buckets = new Map<string, NutritionLog[]>();
    for (const row of items) {
      const wkKey = toYMD(startOfISOWeek(new Date(row.log_date)));
      const arr = buckets.get(wkKey) ?? [];
      arr.push(row);
      buckets.set(wkKey, arr);
    }
    return [...buckets.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([wkStart, rows]) => {
        rows.sort((a, b) => {
          const da = (new Date(a.log_date).getDay() || 7);
          const db = (new Date(b.log_date).getDay() || 7);
          return da - db;
        });

        const sums = rows.reduce(
          (acc, r) => ({
            calories: acc.calories + (r.calories ?? 0),
            protein:  acc.protein  + (r.protein  ?? 0),
            carbs:    acc.carbs    + ((r as any).carbohydrate ?? r.carbohydrate ?? 0),
            fat:      acc.fat      + (r.fat      ?? 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        const n = rows.length || 1;
        const avg = {
          calories: sums.calories / n,
          protein:  sums.protein  / n,
          carbs:    sums.carbs    / n,
          fat:      sums.fat      / n,
          count: n,
        };

        const data: Row[] = [
          ...rows.map((r) => ({ kind: 'row', item: r } as Row)),
          { kind: 'summary', avg } as Row,
        ];

        return { titleParts: weekLabelParts(new Date(wkStart)), data };
      });
  }, [items]);

  if (!expanded) {
    // collapsed: just the toggle bar
    return (
      <View style={{ backgroundColor: pal.bg }}>
        <View style={styles.topBar}>
          <Text
            onPress={onToggle}
            style={[styles.topBarLink, { color: pal.primary }]}
          >
            Show Nutrition Table
          </Text>
        </View>
      </View>
    );
  }

  // expanded: overlay + list
  return (
    <View style={{ flex: 1, backgroundColor: pal.bg }}>
      <View
        style={[
          styles.headerOverlay,
          {
            height: HEADER_HEIGHT,
            backgroundColor: pal.headerBg,
            borderBottomColor: pal.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Text
            onPress={onToggle}
            style={[styles.topBarLink, { color: pal.primary }]}
          >
            Hide Nutrition Table
          </Text>
        </View>
        <View style={[styles.row, { backgroundColor: pal.headerBg, borderColor: pal.border }]}>
          <Text style={[styles.cellDate, styles.headerText, { color: pal.headerText }]}>Day</Text>
          <Text style={[styles.cellNum, styles.headerText, { color: pal.headerText }]}>Calories</Text>
          <Text style={[styles.cellNum, styles.headerText, { color: pal.headerText }]}>Carbs (g)</Text>
          <Text style={[styles.cellNum, styles.headerText, { color: pal.headerText }]}>Fat (g)</Text>
          <Text style={[styles.cellNum, styles.headerText, { color: pal.headerText }]}>Protein (g)</Text>
        </View>
      </View>

      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={(item, idx) => (item.kind === 'row' ? `r-${item.item.id}` : `s-${idx}`)}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={[
            styles.sectionHeader,
            { backgroundColor: pal.sectionBg, borderColor: pal.border }
          ]}>
            <Text>
              <Text style={{ color: pal.sectionWeek, fontWeight: '700' }}>
                {section.titleParts.week}
              </Text>
              <Text style={{ color: pal.sectionRange }}>
                {`: ${section.titleParts.range}`}
              </Text>
            </Text>
          </View>
        )}
        renderItem={({ item }) =>
          item.kind === 'row' ? (
            <View style={[styles.row, { backgroundColor: pal.rowBg, borderColor: pal.border }]}>
              <Text style={[styles.cellDate, { color: pal.text }]}>
                {new Date(item.item.log_date).toLocaleDateString('en-GB', { weekday: 'short' })}
              </Text>
              <Text style={[styles.cellNum, { color: pal.text }]}>{fmtCal(item.item.calories)}</Text>
              <Text style={[styles.cellNum, { color: pal.text }]}>{fmt1((item.item as any).carbohydrate ?? item.item.carbohydrate)}</Text>
              <Text style={[styles.cellNum, { color: pal.text }]}>{fmt1(item.item.fat)}</Text>
              <Text style={[styles.cellNum, { color: pal.text }]}>{fmt1(item.item.protein)}</Text>
            </View>
          ) : (
            <View style={[styles.row, { backgroundColor: pal.summaryBg, borderColor: pal.border }]}>
              <Text style={[styles.cellDate, { color: pal.summaryText, fontWeight: '700' }]} />
              <Text style={[styles.cellNum, { color: pal.summaryText }]}>{fmtCal(item.avg.calories)}</Text>
              <Text style={[styles.cellNum, { color: pal.summaryText }]}>{fmt1(item.avg.carbs)}</Text>
              <Text style={[styles.cellNum, { color: pal.summaryText }]}>{fmt1(item.avg.fat)}</Text>
              <Text style={[styles.cellNum, { color: pal.summaryText }]}>{fmt1(item.avg.protein)}</Text>
            </View>
          )
        }
        style={{ marginTop: HEADER_HEIGHT }}
        contentContainerStyle={{ paddingBottom: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6.5,
    paddingHorizontal: 10,
  },
  cellDate: { flex: 0.8, fontSize: 14, textAlign: 'left' },
  cellNum: { flex: 1.1, fontSize: 14, textAlign: 'center' },
  headerText: { fontWeight: '800' },
  headerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 2,
    ...(Platform.OS === 'android' ? { elevation: 2 } : null),
  },
  topBar: {
    height: TOPBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingVertical: 6.5,
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
    ...(Platform.OS === 'android' ? { elevation: 1 } : null),
  },
});
