import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const githubPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2f81f7',
    onPrimary: '#ffffff',
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#21262d',
    onSurface: '#c9d1d9',
    onSurfaceVariant: '#8b949e',
    outline: '#30363d',
    error: '#f85149',
  },
};
