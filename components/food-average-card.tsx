import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  calories: number | string;   // already averaged (int)
  carbs: string;               // 1 d.p. string
  fat: string;                 // 1 d.p. string
  protein: string;             // 1 d.p. string
  title?: string;
};

export default function AverageCard({
  calories, carbs, fat, protein, title = '7 day average',
}: Props) {
  const { colors, dark } = useTheme();
  const bg = dark ? '#0f1216' : '#ffffff';
  const border = dark ? '#1f2a37' : '#e5e7eb';
  const text = colors.text;
  const sub = dark ? '#9ca3af' : '#6b7280';
  const accent = dark ? '#9fd4ff' : '#0b6bcb';

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.title, { color: sub }]}>{title}</Text>

      <View style={styles.kcalRow}>
        <Text accessibilityRole="header" style={[styles.kcal, { color: text }]}>
          {calories}
        </Text>
        <Text style={[styles.kcalUnit, { color: sub }]}>kcal</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: border }]} />

      <View style={styles.macrosRow}>
        <View style={styles.cell}>
          <Text style={[styles.label, { color: sub }]}>Carbs</Text>
          <Text style={[styles.value, { color: accent }]}>{carbs} g</Text>
        </View>
        <View style={[styles.cell, styles.midCell]}>
          <Text style={[styles.label, { color: sub }]}>Fat</Text>
          <Text style={[styles.value, { color: accent }]}>{fat} g</Text>
        </View>
        <View style={styles.cell}>
          <Text style={[styles.label, { color: sub }]}>Protein</Text>
          <Text style={[styles.value, { color: accent }]}>{protein} g</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  kcal: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    marginRight: 6,
  },
  kcalUnit: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cell: { flex: 1, alignItems: 'center' },
  midCell: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { marginTop: 4, fontSize: 18, fontWeight: '800' },
});
