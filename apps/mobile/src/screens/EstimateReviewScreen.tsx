import { useEffect, useMemo, useState } from 'react';
import { Linking, Share, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, HelperText, Text } from 'react-native-paper';

import { api, Estimate } from '../api/client';
import { RootStackParamList } from '../navigation/RootNavigator';

// Review estimate details before generating pdf or sharing

export function EstimateReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EstimateReview'>>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
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
    try {
      await Share.share({ message: `Estimate PDF: ${pdfUrl}`, url: pdfUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share PDF');
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Estimate Review</Text>
      <Text>Estimate ID: {route.params.estimateId}</Text>
      <Text>Status: {estimate?.status ?? '-'}</Text>
      <Text>Version: {estimate?.version ?? '-'}</Text>
      <Text>Notes: {estimate?.specialNotes || '-'}</Text>
      <Text>Labor: ${estimate?.totals?.laborTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Equipment: ${estimate?.totals?.equipmentTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Adjustments: ${estimate?.totals?.adjustmentsTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>Grand Total: ${estimate?.totals?.grandTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text>PDF URL: {pdfUrl}</Text>
      <Button mode="contained" onPress={onOpenPdf} loading={loading} disabled={loading}>
        Open PDF
      </Button>
      <Button mode="outlined" onPress={onSharePdf} loading={loading} disabled={loading}>
        Share PDF
      </Button>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
    </View>
  );
}
