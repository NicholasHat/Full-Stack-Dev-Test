import { View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';

// Component for searching equipment

export function EquipmentSearch() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Equipment</Text>
      <Searchbar placeholder="Search equipment" value="" onChangeText={() => {}} />
    </View>
  );
}
