import { useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, HelperText, Text } from 'react-native-paper';

import { UploadFileInput } from '../api/client';

type NotesPhotoCaptureProps = {
  disabled?: boolean;
  onFileReady: (file: UploadFileInput) => Promise<void> | void;
};

// Component for capturing photos related to notes
export function NotesPhotoCapture({ disabled = false, onFileReady }: NotesPhotoCaptureProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function capturePhoto() {
    setBusy(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await onFileReady({
        uri: asset.uri,
        name: asset.fileName ?? `notes-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Notes Photo</Text>
      <Button mode="contained-tonal" onPress={capturePhoto} disabled={disabled || busy} loading={busy}>
        Take Photo & Apply AI Draft
      </Button>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
    </View>
  );
}
