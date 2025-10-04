import type { NutritionLog } from '@/services/nutrition';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Props = {
  items: NutritionLog[];
};

export default function NutritionTable({ items }: Props) {
  return (
    <View style={{ flex: 1 }}>
      {/* Table header */}
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.headerText]}>Date</Text>
        <Text style={[styles.cell, styles.headerText]}>Calories</Text>
        <Text style={[styles.cell, styles.headerText]}>Protein (g)</Text>
        <Text style={[styles.cell, styles.headerText]}>Carbs (g)</Text>
        <Text style={[styles.cell, styles.headerText]}>Fat (g)</Text>
      </View>

      {/* Table body */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>
              {new Date(item.log_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
            <Text style={styles.cell}>{item.calories ?? '-'}</Text>
            <Text style={styles.cell}>{item.protein ?? '-'}</Text>
            <Text style={styles.cell}>{item.carbohydrate ?? '-'}</Text>
            <Text style={styles.cell}>{item.fat ?? '-'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#fff', // adjust for light/dark themes
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#222',
  },
  headerText: {
    fontWeight: '600',
    color: '#eee',
  },
});
