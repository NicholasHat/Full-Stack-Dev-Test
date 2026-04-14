import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Screen edit form for editing job details

export function JobEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'JobEdit'>>();
  const jobId = route.params?.jobId;

  const [customerId, setCustomerId] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [specialNotes, setSpecialNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (jobId ? `Edit ${jobId}` : 'New Job'), [jobId]);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const id = jobId;

    async function loadJob() {
      setLoading(true);
      setError(null);
      try {
        const job = await api.getJob(id);
        setCustomerId(job.customerId ?? '');
        setAddress(job.address ?? '');
        setScheduledDate(job.scheduledDate ?? '');
        setStatus(job.status ?? 'draft');
        setSpecialNotes(job.specialNotes ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  async function onSave() {
    if (!customerId.trim()) {
      setError('Customer ID is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (jobId) {
        await api.updateJob(jobId, {
          customerId: customerId.trim(),
          address: address || null,
          scheduledDate: scheduledDate || null,
          status: status || 'draft',
          specialNotes: specialNotes || null,
        });
      } else {
        await api.createJob({
          customerId: customerId.trim(),
          address: address || null,
          scheduledDate: scheduledDate || null,
          status: status || 'draft',
          specialNotes: specialNotes || null,
        });
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleMedium">{title}</Text>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
      <TextInput label="Customer ID" value={customerId} onChangeText={setCustomerId} mode="outlined" />
      <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" />
      <TextInput
        label="Scheduled Date"
        value={scheduledDate}
        onChangeText={setScheduledDate}
        mode="outlined"
        placeholder="YYYY-MM-DD"
      />
      <TextInput
        label="Status"
        value={status}
        onChangeText={setStatus}
        mode="outlined"
        placeholder="draft"
      />
      <TextInput
        label="Special Notes"
        value={specialNotes}
        onChangeText={setSpecialNotes}
        mode="outlined"
        multiline
      />
      <Button mode="contained" onPress={onSave} loading={saving || loading} disabled={saving || loading}>
        Save Job
      </Button>
    </ScrollView>
  );
}
