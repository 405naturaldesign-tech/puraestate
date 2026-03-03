// src/components/common/Button.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';
import { COLORS } from '../../styles/colors';
import { SPACING, DIMENSIONS, BORDER_RADIUS } from '../../styles/spacing';

interface CustomButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  ...props
}) => {
  const getMode = (): 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal' => {
    if (variant === 'outline') return 'outlined';
    if (variant === 'secondary') return 'contained-tonal';
    return 'contained';
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  return (
    <PaperButton
      mode={getMode()}
      onPress={props.onPress}
      disabled={disabled || loading}
      loading={loading}
      style={[
        getSize(),
        fullWidth && { width: '100%' },
        style,
      ]}
      labelStyle={getLabelStyle(size)}
      contentStyle={styles.content}
      {...props}
    >
      {label}
    </PaperButton>
  );
};

const getLabelStyle = (size: string) => {
  switch (size) {
    case 'small':
      return styles.labelSmall;
    case 'large':
      return styles.labelLarge;
    default:
      return styles.labelMedium;
  }
};

const styles = StyleSheet.create({
  buttonSmall: {
    height: 36,
    justifyContent: 'center',
  },
  buttonMedium: {
    height: DIMENSIONS.buttonHeight,
    justifyContent: 'center',
  },
  buttonLarge: {
    height: 56,
    justifyContent: 'center',
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingVertical: SPACING.sm,
  },
});

export default CustomButton;
