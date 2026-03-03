// src/styles/colors.ts

export const COLORS = {
  // Primary
  primary: '#1F5C3D',
  primaryLight: '#2D7A52',
  primaryDark: '#164A31',

  // Secondary
  secondary: '#00BFA5',
  secondaryLight: '#26C6DA',
  secondaryDark: '#00897B',

  // Tertiary
  tertiary: '#FF6F00',
  tertiaryLight: '#FFB74D',
  tertiaryDark: '#E65100',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  dark: '#1E1E1E',
  darkGray: '#424242',
  gray: '#757575',
  lightGray: '#BDBDBD',
  extraLight: '#E0E0E0',
  background: '#F5F5F5',
  surface: '#FFFFFF',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Semantic
  text: {
    primary: '#1E1E1E',
    secondary: '#757575',
    tertiary: '#BDBDBD',
    inverse: '#FFFFFF',
    disabled: '#BDBDBD',
  },

  border: {
    primary: '#E0E0E0',
    secondary: '#BDBDBD',
  },

  // Transparent
  transparent: 'rgba(0, 0, 0, 0)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlay10: 'rgba(0, 0, 0, 0.1)',
  overlay20: 'rgba(0, 0, 0, 0.2)',
  overlay40: 'rgba(0, 0, 0, 0.4)',

  // Property types
  propertyType: {
    house: '#8B4513',
    apartment: '#4169E1',
    condo: '#DC143C',
    townhouse: '#FF8C00',
    land: '#228B22',
  },

  // Status
  status: {
    available: '#4CAF50',
    pending: '#FF9800',
    sold: '#F44336',
    rented: '#2196F3',
  },

  // Gradients (for linear gradient backgrounds)
  gradient: {
    primary: ['#1F5C3D', '#2D7A52'],
    secondary: ['#00BFA5', '#26C6DA'],
    success: ['#4CAF50', '#45A049'],
    error: ['#F44336', '#DA190B'],
  },
};

export const getPropertyTypeColor = (type: string): string => {
  return COLORS.propertyType[type as keyof typeof COLORS.propertyType] || COLORS.primary;
};

export const getStatusColor = (status: string): string => {
  return COLORS.status[status as keyof typeof COLORS.status] || COLORS.gray;
};
