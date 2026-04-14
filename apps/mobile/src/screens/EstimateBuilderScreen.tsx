import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

// Main screen for building an estimate

export function EstimateBuilderScreen() {
  const [jobId, setJobId] = useState('');
  const [customerId, setCustomerId] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Estimate Builder (MVP scaffold)</Text>
      <TextInput label="Job ID" value={jobId} onChangeText={setJobId} mode="outlined" />
      <TextInput
        label="Customer ID"
        value={customerId}
        onChangeText={setCustomerId}
        mode="outlined"
      />
      <Button mode="contained">Load Catalog Data</Button>
      <Button mode="outlined">Run Reprice</Button>
      <Button mode="contained-tonal">Finalize</Button>
    </ScrollView>
  );
}
