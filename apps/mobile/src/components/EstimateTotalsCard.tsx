import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EstimateTotals } from '../api/client';
import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

type EstimateTotalsCardProps = {
  totals: EstimateTotals | null | undefined;
  title?: string;
};

export function EstimateTotalsCard({ totals, title = 'Totals' }: EstimateTotalsCardProps) {
  return (
    <View style={screenStyles.card}>
      <Text variant="titleSmall" style={styles.text}>
        {title}
      </Text>
      <Text style={styles.text}>Labor: ${totals?.laborTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text style={styles.text}>Equipment: ${totals?.equipmentTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text style={styles.text}>Adjustments: ${totals?.adjustmentsTotal?.toFixed(2) ?? '0.00'}</Text>
      <Text style={styles.successText}>Grand Total: ${totals?.grandTotal?.toFixed(2) ?? '0.00'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: appColors.text,
  },
  successText: {
    color: appColors.success,
  },
});
