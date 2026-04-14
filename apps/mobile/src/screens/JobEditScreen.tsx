import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

// Screen edit form for editing job details

export function JobEditScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Job Form (placeholder)</Text>
      <TextInput label="Customer ID" mode="outlined" />
      <TextInput label="Address" mode="outlined" />
      <TextInput label="Scheduled Date" mode="outlined" placeholder="YYYY-MM-DD" />
      <Button mode="contained">Save Job</Button>
    </View>
  );
}
