import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
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

  async function load() {
    setItems(await api.listJobs());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text variant="titleMedium">Jobs</Text>
        <Text style={styles.mutedText}>Track active jobs and open estimate builder.</Text>
      </View>

      <View style={styles.card}>
        <Button mode="contained" onPress={load}>
          Refresh Jobs
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('JobEdit')}>
          New Job
        </Button>
      </View>

      {items.map((j) => (
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
          </Card.Actions>
        </Card>
      ))}
      {items.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>No jobs yet.</Text>
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
});
