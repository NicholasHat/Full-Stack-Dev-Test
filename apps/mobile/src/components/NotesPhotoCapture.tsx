import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Component for capturing photos related to notes

export function NotesPhotoCapture() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Notes Photo</Text>
      <Button mode="contained-tonal">Take Photo (coming soon)</Button>
    </View>
  );
}
