import { useEffect, useMemo, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, HelperText, Text } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { api, Estimate } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Review estimate details before generating pdf or sharing

export function EstimateReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EstimateReview'>>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = useMemo(() => api.estimatePdfUrl(route.params.estimateId), [route.params.estimateId]);

  useEffect(() => {
    async function loadEstimate() {
      setLoading(true);
      setError(null);
      try {
        setEstimate(await api.getEstimate(route.params.estimateId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load estimate');
      } finally {
        setLoading(false);
      }
    }

    loadEstimate();
  }, [route.params.estimateId]);

  async function onOpenPdf() {
    try {
      await Linking.openURL(pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open PDF');
    }
  }

  async function onSharePdf() {
    setSharing(true);
    setError(null);
    try {
      const fileUri = `${FileSystem.cacheDirectory}estimate-${route.params.estimateId}.pdf`;
      const downloaded = await FileSystem.downloadAsync(pdfUrl, fileUri);

      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Estimate ${route.params.estimateId}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Share.share({ message: `Estimate PDF: ${pdfUrl}`, url: pdfUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share PDF');
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text variant="titleMedium">Estimate Review</Text>
        <Text style={[styles.mutedText, styles.mt8]}>ID: {route.params.estimateId}</Text>
        <Text style={styles.mutedText}>Status: {estimate?.status ?? '-'}</Text>
        <Text style={styles.mutedText}>Version: {estimate?.version ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall" style={[styles.text, styles.mb8]}>
          Totals
        </Text>
        <Text style={styles.text}>Labor: ${estimate?.totals?.laborTotal?.toFixed(2) ?? '0.00'}</Text>
        <Text style={styles.text}>Equipment: ${estimate?.totals?.equipmentTotal?.toFixed(2) ?? '0.00'}</Text>
        <Text style={styles.text}>Adjustments: ${estimate?.totals?.adjustmentsTotal?.toFixed(2) ?? '0.00'}</Text>
        <Text style={[styles.successText, styles.mt8]}>Grand Total: ${estimate?.totals?.grandTotal?.toFixed(2) ?? '0.00'}</Text>
      </View>

      <View style={styles.card}>
        <Text variant="titleSmall" style={[styles.text, styles.mb8]}>
          Notes
        </Text>
        <Text style={styles.mutedText}>{estimate?.specialNotes || '-'}</Text>
      </View>

      <View style={[styles.card, styles.mb8]}>
        <Text style={styles.mutedText}>PDF URL</Text>
        <Text style={styles.text}>{pdfUrl}</Text>
      </View>

      <Button mode="contained" onPress={onOpenPdf} loading={loading} disabled={loading || sharing}>
        Open PDF
      </Button>
      <View style={styles.mt8} />
      <Button mode="outlined" onPress={onSharePdf} loading={sharing} disabled={loading || sharing}>
        Share PDF
      </Button>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0D1117',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    padding: 16,
  },
  text: {
    color: '#C9D1D9',
  },
  mutedText: {
    color: '#8B949E',
  },
  successText: {
    color: '#3FB950',
  },
  mb8: {
    marginBottom: 8,
  },
  mt8: {
    marginTop: 8,
  },
});
