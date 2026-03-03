// src/styles/theme.ts
import { MD3LightTheme } from 'react-native-paper';
import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';

export const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryLight,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondaryLight,
    tertiary: COLORS.tertiary,
    tertiaryContainer: COLORS.tertiaryLight,
    error: COLORS.error,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.extraLight,
    outline: COLORS.border.primary,
    outlineVariant: COLORS.border.secondary,
  },
  typography: TYPOGRAPHY,
};

export default customTheme;
