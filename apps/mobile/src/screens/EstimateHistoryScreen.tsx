import { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Searchbar, Text } from 'react-native-paper';

import { api, Estimate } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  deleteDraftById,
  listDrafts,
  StoredEstimateDraftRow,
} from '../storage/drafts.sqlite';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Screen for listing past estimates and local drafts, with search and navigation to review or builder screens.

export function EstimateHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [drafts, setDrafts] = useState<StoredEstimateDraftRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const serverEstimates = await api.listEstimates();
      setEstimates(serverEstimates);
      setDrafts(listDrafts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load estimate history');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredEstimates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return estimates;
    }

    return estimates.filter((estimate) => {
      return (
        estimate.id.toLowerCase().includes(q) ||
        estimate.jobId.toLowerCase().includes(q) ||
        estimate.customerId.toLowerCase().includes(q) ||
        estimate.status.toLowerCase().includes(q)
      );
    });
  }, [estimates, query]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return drafts;
    }

    return drafts.filter((draft) => {
      return (
        draft.id.toLowerCase().includes(q) ||
        (draft.job_id ?? '').toLowerCase().includes(q) ||
        (draft.customer_id ?? '').toLowerCase().includes(q)
      );
    });
  }, [drafts, query]);

  function onDeleteDraft(draftId: string) {
    Alert.alert('Delete Draft', `Delete local draft ${draftId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDraftById(draftId);
          setDrafts((prev) => prev.filter((item) => item.id !== draftId));
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
        <Text variant="titleMedium">Estimate History</Text>
        <Text style={styles.mutedText}>Find server estimates and local drafts.</Text>
      </View>

      <View style={styles.card}>
        <Searchbar value={query} onChangeText={setQuery} placeholder="Search estimate/job/customer/status" />
        <Button mode="contained" onPress={load} loading={busy} disabled={busy}>
          Refresh
        </Button>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall" style={styles.textRow}>Server Estimates ({filteredEstimates.length})</Text>
        {filteredEstimates.length === 0 ? (
          <Text style={styles.mutedText}>No estimates found.</Text>
        ) : (
          filteredEstimates.map((estimate) => (
            <Card key={estimate.id} style={styles.listCard}>
              <Card.Title title={estimate.id} subtitle={`${estimate.status} · v${estimate.version}`} />
              <Card.Content>
                <Text style={styles.textRow}>Job: {estimate.jobId}</Text>
                <Text style={styles.textRow}>Customer: {estimate.customerId}</Text>
                <Text style={styles.mutedText}>Updated: {new Date(estimate.updatedAt).toLocaleString()}</Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="text" onPress={() => navigation.navigate('EstimateReview', { estimateId: estimate.id })}>
                  Review
                </Button>
                <Button
                  mode="text"
                  onPress={() =>
                    navigation.navigate('EstimateBuilder', {
                      estimateId: estimate.id,
                      jobId: estimate.jobId,
                      customerId: estimate.customerId,
                    })
                  }
                >
                  Continue
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall" style={styles.textRow}>Local Drafts ({filteredDrafts.length})</Text>
        {filteredDrafts.length === 0 ? (
          <Text style={styles.mutedText}>No local drafts found.</Text>
        ) : (
          filteredDrafts.map((draft) => (
            <Card key={draft.id} style={styles.listCard}>
              <Card.Title title={draft.id} subtitle={`Local draft · ${new Date(draft.updated_at).toLocaleString()}`} />
              <Card.Content>
                <Text style={styles.textRow}>Job: {draft.job_id || '-'}</Text>
                <Text style={styles.textRow}>Customer: {draft.customer_id || '-'}</Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="text"
                  onPress={() =>
                    navigation.navigate('EstimateBuilder', {
                      draftId: draft.id,
                      jobId: draft.job_id || undefined,
                      customerId: draft.customer_id || undefined,
                    })
                  }
                >
                  Open Draft
                </Button>
                <Button mode="text" onPress={() => onDeleteDraft(draft.id)}>
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screenStyles.container,
  },
  content: {
    ...screenStyles.content,
    paddingBottom: 24,
  },
  card: {
    ...screenStyles.card,
  },
  listCard: {
    ...screenStyles.listCard,
  },
  textRow: {
    color: appColors.text,
  },
  mutedText: {
    color: appColors.muted,
  },
  errorText: {
    color: '#F85149',
  },
});
