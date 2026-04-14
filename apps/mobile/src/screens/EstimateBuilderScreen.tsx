import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api, Estimate, EstimateTotals } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Main screen for building an estimate

export function EstimateBuilderScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EstimateBuilder'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [jobId, setJobId] = useState(route.params?.jobId ?? '');
  const [customerId, setCustomerId] = useState(route.params?.customerId ?? '');
  const [estimateId, setEstimateId] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [totals, setTotals] = useState<EstimateTotals | null>(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function syncEstimate(estimate: Estimate) {
    setEstimateId(estimate.id);
    setStatus(estimate.status);
    setTotals(estimate.totals ?? null);
    setNotes(estimate.specialNotes ?? '');
  }

  async function onCreateEstimate() {
    if (!jobId.trim() || !customerId.trim()) {
      setError('Job ID and Customer ID are required to create an estimate.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const estimate = await api.createEstimate({
        jobId: jobId.trim(),
        customerId: customerId.trim(),
        status: 'draft',
        version: 1,
        equipmentLines: [],
        adjustments: [],
        specialNotes: notes || null,
      });
      syncEstimate(estimate);
      setMessage(`Created estimate ${estimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create estimate');
    } finally {
      setBusy(false);
    }
  }

  async function onApplyAiDraftFromPhoto() {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo permission is required.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (picked.canceled || picked.assets.length === 0) {
        return;
      }

      const asset = picked.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? `notes-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      };

      const aiResult = await api.aiNotesImageToDraft(file);
      const updatedEstimate = await api.applyEstimateDraft(estimateId, {
        ...aiResult.draft,
        jobId: aiResult.draft.jobId ?? (jobId || null),
        customerId: aiResult.draft.customerId ?? (customerId || null),
      });

      syncEstimate(updatedEstimate);
      setMessage('AI draft applied to estimate.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply AI draft');
    } finally {
      setBusy(false);
    }
  }

  async function onReprice() {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      await api.applyEstimateDraft(estimateId, {
        specialNotes: notes || null,
      });

      const repriced = await api.repriceEstimate(estimateId);
      setTotals(repriced.totals);
      setMessage('Repriced successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprice estimate');
    } finally {
      setBusy(false);
    }
  }

  async function onFinalize() {
    if (!estimateId.trim()) {
      setError('Create an estimate first.');
      return;
    }

    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const finalized = await api.finalizeEstimate(estimateId);
      syncEstimate(finalized);
      setMessage(`Finalized estimate ${finalized.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize estimate');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Estimate Builder</Text>
      <TextInput label="Job ID" value={jobId} onChangeText={setJobId} mode="outlined" />
      <TextInput
        label="Customer ID"
        value={customerId}
        onChangeText={setCustomerId}
        mode="outlined"
      />
      <TextInput
        label="Estimate ID"
        value={estimateId}
        onChangeText={setEstimateId}
        mode="outlined"
        placeholder="Auto-filled after create"
      />
      <TextInput
        label="Special Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
      />

      <Button mode="contained" onPress={onCreateEstimate} disabled={busy} loading={busy}>
        Create Estimate
      </Button>
      <Button mode="outlined" onPress={onApplyAiDraftFromPhoto} disabled={busy} loading={busy}>
        Apply AI Draft (Notes Photo)
      </Button>
      <Button mode="outlined" onPress={onReprice} disabled={busy} loading={busy}>
        Run Reprice
      </Button>
      <Button mode="contained-tonal" onPress={onFinalize} disabled={busy} loading={busy}>
        Finalize
      </Button>
      <Button
        mode="text"
        disabled={!estimateId.trim()}
        onPress={() => navigation.navigate('EstimateReview', { estimateId })}
      >
        Review & Share PDF
      </Button>

      <Divider />
      <Text>Status: {status}</Text>
      <Text>Message: {message || '-'}</Text>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>

      <Text variant="titleSmall">Totals</Text>
      <Text>Labor: ${totals?.laborTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Equipment: ${totals?.equipmentTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Adjustments: ${totals?.adjustmentsTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Grand Total: ${totals?.grandTotal?.toFixed(2) ?? '0.00'}</Text>
    </ScrollView>
  );
}
