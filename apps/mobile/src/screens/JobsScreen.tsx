import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api, Job } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Screen for listing jobs. This is the main screen that users will see when they open the app. 
// It shows a list of jobs with their status and address.

export function JobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setItems(await api.listJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const statusOptions = useMemo(() => {
    const unique = [...new Set(items.map((job) => (job.status || 'unknown').trim()).filter(Boolean))];
    return ['all', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') {
      return items;
    }
    return items.filter((job) => (job.status || 'unknown') === statusFilter);
  }, [items, statusFilter]);

  function onDeleteJob(jobId: string) {
    Alert.alert('Delete Job', `Delete job ${jobId}? This also removes related estimates.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteJob(jobId);
            setItems((prev) => prev.filter((item) => item.id !== jobId));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete job');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}
    >
      <View style={styles.card}>
        <Button mode="contained" onPress={load} loading={busy} disabled={busy}>
          Refresh Jobs
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('JobEdit')} disabled={busy}>
          New Job
        </Button>
        <HelperText type="error" visible={!!error}>
          {error ?? ''}
        </HelperText>
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall" style={styles.textRow}>Filter by Status</Text>
        <View style={styles.filterRow}>
          {statusOptions.map((option) => (
            <Button
              key={option}
              compact
              mode={statusFilter === option ? 'contained' : 'outlined'}
              onPress={() => setStatusFilter(option)}
            >
              {option}
            </Button>
          ))}
        </View>
      </View>

      {filteredItems.map((j) => (
        <Card key={j.id} onPress={() => navigation.navigate('JobEdit', { jobId: j.id })} style={styles.listCard}>
          <Card.Title title={j.id} subtitle={j.status} />
          <Card.Content>
            <Text style={styles.textRow}>{j.address || 'No address'}</Text>
          </Card.Content>
          <Card.Actions>
              <Button
                mode="text"
                onPress={() => navigation.navigate('EstimateBuilder', { jobId: j.id, customerId: j.customerId })}
              >
                Build Estimate
              </Button>
              <Button mode="text" onPress={() => onDeleteJob(j.id)}>
                Delete
              </Button>
          </Card.Actions>
        </Card>
      ))}
      {filteredItems.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>No jobs match this filter.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screenStyles.container,
  },
  content: {
    ...screenStyles.content,
  },
  card: {
    ...screenStyles.card,
  },
  listCard: {
    ...screenStyles.listCard,
  },
  mutedText: {
    color: appColors.muted,
  },
  textRow: {
    color: appColors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
