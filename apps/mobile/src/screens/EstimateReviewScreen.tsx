import { useEffect, useMemo, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, HelperText, Text } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { api, Estimate } from '../api/client';
import { EstimateTotalsCard } from '../components/EstimateTotalsCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

// Review estimate details before generating pdf or sharing

const PDF_DOWNLOAD_TIMEOUT_MS = 30000;

async function downloadPdfWithTimeout(pdfUrl: string, fileUri: string) {
  return await Promise.race([
    FileSystem.downloadAsync(pdfUrl, fileUri),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timed out while downloading PDF')), PDF_DOWNLOAD_TIMEOUT_MS);
    }),
  ]);
}

export function EstimateReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EstimateReview'>>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
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
    setOpening(true);
    setError(null);
    try {
      const fileUri = `${FileSystem.cacheDirectory}estimate-${route.params.estimateId}.pdf`;
      const downloaded = await downloadPdfWithTimeout(pdfUrl, fileUri);
      await Linking.openURL(downloaded.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open PDF');
    } finally {
      setOpening(false);
    }
  }

  async function onSharePdf() {
    setSharing(true);
    setError(null);
    try {
      const fileUri = `${FileSystem.cacheDirectory}estimate-${route.params.estimateId}.pdf`;
      const downloaded = await downloadPdfWithTimeout(pdfUrl, fileUri);

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

      <EstimateTotalsCard totals={estimate?.totals} />

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

      <Button mode="contained" onPress={onOpenPdf} loading={loading || opening} disabled={loading || sharing || opening}>
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
    ...screenStyles.container,
    padding: 16,
  },
  card: {
    ...screenStyles.card,
    marginBottom: 12,
    padding: 16,
  },
  text: {
    color: appColors.text,
  },
  mutedText: {
    color: appColors.muted,
  },
  successText: {
    color: appColors.success,
  },
  mb8: {
    marginBottom: 8,
  },
  mt8: {
    marginTop: 8,
  },
});
