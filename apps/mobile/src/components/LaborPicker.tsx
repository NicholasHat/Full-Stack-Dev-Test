import { View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

// Component for picking labor details

export function LaborPicker() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Labor</Text>
      <TextInput label="Job Type" mode="outlined" />
      <TextInput label="Level" mode="outlined" />
      <TextInput label="Hours" mode="outlined" keyboardType="decimal-pad" />
    </View>
  );
}
