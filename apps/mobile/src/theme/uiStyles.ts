import { StyleSheet } from 'react-native';

export const githubColors = {
  bg: '#0D1117',
  canvas: '#161B22',
  border: '#30363D',
  text: '#C9D1D9',
  muted: '#8B949E',
  success: '#3FB950',
};

export const uiStyles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: githubColors.text,
  },
  mutedText: {
    color: githubColors.muted,
  },
  text: {
    color: githubColors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listRow: {
    color: githubColors.text,
  },
});
