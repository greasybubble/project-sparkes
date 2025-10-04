// components/weight-average-card.tsx
import { useTheme } from '@react-navigation/native';
import { Text, View } from 'react-native';

export default function WeightAverageCard({ avgKg }: { avgKg: number }) {
  const { colors, dark } = useTheme();
  const sub = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? '#202632' : '#e5e7eb';
  const panel = dark ? '#0f1216' : '#ffffff';

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        borderRadius: 12,
        backgroundColor: panel,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ color: sub, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8 }}>
        7 DAY AVERAGE
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 30, fontWeight: '900', color: colors.text, lineHeight: 34 }}>
            {avgKg.toFixed(1)}
          </Text>
          <Text style={{ marginTop: 2, color: sub, fontSize: 14, fontWeight: '700' }}>kg</Text>
        </View>
        <View style={{ flex: 1.2 }}>
          {/* spacer area to align with nutrition’s right column; keep for visual balance */}
        </View>
      </View>
    </View>
  );
}
