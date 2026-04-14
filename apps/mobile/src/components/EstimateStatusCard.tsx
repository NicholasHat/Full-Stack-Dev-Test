import { StyleSheet, View } from 'react-native';
import { HelperText, Text } from 'react-native-paper';

import { screenStyles } from '../theme/screenStyles';
import { appColors } from '../theme/uiStyles';

type EstimateStatusCardProps = {
  status: string;
  message?: string;
  error?: string | null;
};

export function EstimateStatusCard({ status, message, error }: EstimateStatusCardProps) {
  return (
    <View style={screenStyles.card}>
      <Text style={styles.textRow}>Status: {status || '-'}</Text>
      <Text style={styles.textRow}>Message: {message || '-'}</Text>
      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  textRow: {
    color: appColors.text,
  },
});
