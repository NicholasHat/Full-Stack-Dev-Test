import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Component for picking bundles

export function BundlePicker() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Bundles</Text>
      <Button mode="outlined">Add Bundle (coming soon)</Button>
    </View>
  );
}
