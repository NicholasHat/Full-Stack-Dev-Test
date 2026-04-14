import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Component for capturing voice notes related to estimates

export function VoiceCapture() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Voice Capture</Text>
      <Button mode="contained-tonal">Record Voice (coming soon)</Button>
    </View>
  );
}
