import { useState } from 'react';
import { View } from 'react-native';
import { Audio } from 'expo-av';
import { Button, HelperText, Text } from 'react-native-paper';

import { UploadFileInput } from '../api/client';

type VoiceCaptureProps = {
  disabled?: boolean;
  onFileReady: (file: UploadFileInput) => Promise<void> | void;
};

// Component for capturing voice notes related to estimates
export function VoiceCapture({ disabled = false, onFileReady }: VoiceCaptureProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRecording() {
    setError(null);
    setBusy(true);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(created.recording);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start recording');
    } finally {
      setBusy(false);
    }
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) {
        setError('Recording failed to save.');
        return;
      }

      await onFileReady({
        uri,
        name: `voice-${Date.now()}.m4a`,
        type: 'audio/mp4',
      });
      setRecording(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to stop recording');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleSmall">Voice Capture</Text>
      {!recording ? (
        <Button mode="contained-tonal" onPress={startRecording} disabled={disabled || busy} loading={busy}>
          Start Recording
        </Button>
      ) : (
        <Button mode="contained" onPress={stopRecording} disabled={disabled || busy} loading={busy}>
          Stop & Apply AI Draft
        </Button>
      )}
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
    </View>
  );
}
