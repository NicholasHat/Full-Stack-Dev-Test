import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const githubPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 6,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#58A6FF',
    onPrimary: '#ffffff',
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#21262d',
    secondary: '#8b949e',
    tertiary: '#a371f7',
    onSurface: '#c9d1d9',
    onSurfaceVariant: '#8b949e',
    outline: '#30363d',
    outlineVariant: '#30363d',
    inverseSurface: '#c9d1d9',
    inverseOnSurface: '#0d1117',
    error: '#f85149',
    errorContainer: '#da3633',
    surfaceDisabled: '#21262d',
    onSurfaceDisabled: '#8b949e',
  },
};
