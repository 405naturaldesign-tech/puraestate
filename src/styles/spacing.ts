// src/styles/spacing.ts

// Base unit: 4dp
const BASE = 4;

export const SPACING = {
  xs: BASE * 1, // 4
  sm: BASE * 2, // 8
  md: BASE * 3, // 12
  lg: BASE * 4, // 16
  xl: BASE * 5, // 20
  xxl: BASE * 6, // 24
  xxxl: BASE * 7, // 28
  huge: BASE * 8, // 32
  massive: BASE * 10, // 40
};

export const PADDING = {
  container: SPACING.lg,
  card: SPACING.lg,
  button: SPACING.md,
  input: SPACING.md,
};

export const MARGIN = {
  section: SPACING.huge,
  card: SPACING.lg,
  item: SPACING.md,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const SHADOWS = {
  small: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  medium: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  large: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
};

export const DIMENSIONS = {
  screenPadding: SPACING.lg,
  tabHeight: 64,
  headerHeight: 56,
  buttonHeight: 48,
  inputHeight: 48,
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
};
