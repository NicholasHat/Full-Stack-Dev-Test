import { StyleSheet } from 'react-native';

export const appColors = {
  bg: '#0D1117',
  canvas: '#161B22',
  border: '#30363D',
  text: '#C9D1D9',
  muted: '#8B949E',
  link: '#58A6FF',
  success: '#3FB950',
  purple: '#A371F7',
  danger: '#F85149',
};

export const uiStyles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: appColors.text,
  },
  mutedText: {
    color: appColors.muted,
  },
  text: {
    color: appColors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listRow: {
    color: appColors.text,
  },
});
