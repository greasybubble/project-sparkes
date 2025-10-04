// components/segmented-tabs.tsx
import { useTheme } from '@react-navigation/native';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  tabs: string[];
  value: number;                // active index
  onChange: (index: number) => void;
  style?: object;
};

export default function SegmentedTabs({ tabs, value, onChange, style }: Props) {
  const { colors, dark } = useTheme();
  const border = dark ? '#343a46' : '#cbd5e1';
  const bg = dark ? '#0f1216' : '#f8fafc';
  const activeBg = dark ? '#3b3f46' : '#e2e8f0';
  const inactiveText = dark ? '#cbd5e1' : '#334155';

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          borderRadius: 16,
          padding: 4,
        },
        style,
      ]}
    >
      {tabs.map((label, i) => {
        const active = i === value;
        return (
          <TouchableOpacity
            key={label}
            onPress={() => onChange(i)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? activeBg : 'transparent',
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: active ? '800' : '600',
                color: active ? colors.text : inactiveText,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
