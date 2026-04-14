import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Searchbar, Text, TextInput } from 'react-native-paper';

import { EquipmentCatalogItem } from '../api/client';
import { uiStyles } from '../theme/uiStyles';

type EquipmentSearchProps = {
  equipment: EquipmentCatalogItem[];
  onAdd: (line: { equipmentId: string; qty: number }) => void;
};

// Component for searching equipment
export function EquipmentSearch({ equipment, onAdd }: EquipmentSearchProps) {
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState('1');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return equipment.slice(0, 8);
    }
    return equipment
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [equipment, query]);

  const parsedQty = Number(qty);

  return (
    <View style={uiStyles.section}>
      <Text variant="titleSmall" style={uiStyles.sectionTitle}>Equipment</Text>
      <Searchbar placeholder="Search equipment" value={query} onChangeText={setQuery} />
      <TextInput label="Qty" value={qty} onChangeText={setQty} mode="outlined" keyboardType="numeric" />
      <View style={uiStyles.section}>
        {filtered.map((item) => (
          <Button
            key={item.id}
            mode="outlined"
            onPress={() => onAdd({ equipmentId: item.id, qty: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1 })}
          >
            Add {item.id} - {item.name}
          </Button>
        ))}
      </View>
    </View>
  );
}
