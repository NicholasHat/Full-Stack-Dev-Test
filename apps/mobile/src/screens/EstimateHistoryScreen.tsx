import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  const [estimateSort, setEstimateSort] = useState<'updated_desc' | 'updated_asc'>('updated_desc');
  const [draftSort, setDraftSort] = useState<'updated_desc' | 'updated_asc'>('updated_desc');

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const filteredEstimates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return estimates
      .filter((estimate) => {
        if (!q) {
          return true;
        }
        return (
          estimate.id.toLowerCase().includes(q) ||
          estimate.jobId.toLowerCase().includes(q) ||
          estimate.customerId.toLowerCase().includes(q) ||
          estimate.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime();
        const right = new Date(b.updatedAt).getTime();
        return estimateSort === 'updated_desc' ? right - left : left - right;
      });
  }, [estimateSort, estimates, query]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts
      .filter((draft) => {
        if (!q) {
          return true;
        }
        return (
          draft.id.toLowerCase().includes(q) ||
          (draft.job_id ?? '').toLowerCase().includes(q) ||
          (draft.customer_id ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const left = new Date(a.updated_at).getTime();
        const right = new Date(b.updated_at).getTime();
        return draftSort === 'updated_desc' ? right - left : left - right;
      });
  }, [draftSort, drafts, query]);

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

  function onDeleteEstimate(estimateId: string) {
    Alert.alert('Delete Estimate', `Delete server estimate ${estimateId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteEstimate(estimateId);
            setEstimates((prev) => prev.filter((item) => item.id !== estimateId));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete estimate');
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
        <Searchbar value={query} onChangeText={setQuery} placeholder="Search estimate/job/customer/status" />
        <Button mode="contained" onPress={load} loading={busy} disabled={busy}>
          Refresh
        </Button>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text variant="titleSmall" style={styles.textRow}>Server Estimates ({filteredEstimates.length})</Text>
          <Button
            compact
            mode="outlined"
            onPress={() =>
              setEstimateSort((prev) => (prev === 'updated_desc' ? 'updated_asc' : 'updated_desc'))
            }
          >
            {estimateSort === 'updated_desc' ? 'Newest' : 'Oldest'}
          </Button>
        </View>
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
              <Card.Actions style={styles.cardActionsWrap}>
                <Button
                  mode="text"
                  compact
                  icon="open-in-new"
                  onPress={() => navigation.navigate('EstimateReview', { estimateId: estimate.id })}
                >
                  Open Review
                </Button>
                <Button
                  mode="text"
                  compact
                  icon="pencil"
                  onPress={() =>
                    navigation.navigate('EstimateBuilder', {
                      estimateId: estimate.id,
                      jobId: estimate.jobId,
                      customerId: estimate.customerId,
                    })
                  }
                >
                  Continue Editing
                </Button>
                <Button
                  mode="text"
                  compact
                  icon="content-copy"
                  onPress={() =>
                    navigation.navigate('EstimateBuilder', {
                      copyFromEstimateId: estimate.id,
                      jobId: estimate.jobId,
                      customerId: estimate.customerId,
                    })
                  }
                >
                  Duplicate as New
                </Button>
                <Button mode="text" compact icon="trash-can" onPress={() => onDeleteEstimate(estimate.id)}>
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text variant="titleSmall" style={styles.textRow}>Local Drafts ({filteredDrafts.length})</Text>
          <Button
            compact
            mode="outlined"
            onPress={() => setDraftSort((prev) => (prev === 'updated_desc' ? 'updated_asc' : 'updated_desc'))}
          >
            {draftSort === 'updated_desc' ? 'Newest' : 'Oldest'}
          </Button>
        </View>
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
              <Card.Actions style={styles.cardActionsWrap}>
                <Button
                  mode="text"
                  compact
                  icon="folder-open"
                  onPress={() =>
                    navigation.navigate('EstimateBuilder', {
                      draftId: draft.id,
                      jobId: draft.job_id || undefined,
                      customerId: draft.customer_id || undefined,
                    })
                  }
                >
                  Open in Builder
                </Button>
                <Button mode="text" compact icon="trash-can" onPress={() => onDeleteDraft(draft.id)}>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardActionsWrap: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
