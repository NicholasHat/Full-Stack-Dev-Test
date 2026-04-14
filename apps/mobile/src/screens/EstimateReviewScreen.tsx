import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Review estimate details before generating pdf or sharing

export function EstimateReviewScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Estimate Review (placeholder)</Text>
      <Text>Review pricing breakdown and notes before sharing PDF.</Text>
      <Button mode="contained">Generate PDF</Button>
      <Button mode="outlined">Share</Button>
    </View>
  );
}
