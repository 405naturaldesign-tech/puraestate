// src/components/common/Card.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card as PaperCard, CardProps } from 'react-native-paper';
import { COLORS } from '../../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/spacing';

interface CustomCardProps extends Omit<CardProps, 'children'> {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: number;
  borderRadius?: number;
}

const CustomCard: React.FC<CustomCardProps> = ({
  children,
  variant = 'elevated',
  padding = SPACING.lg,
  borderRadius = BORDER_RADIUS.md,
  style,
  ...props
}) => {
  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      borderRadius,
      padding,
      backgroundColor: variant === 'filled' ? COLORS.extraLight : COLORS.white,
    },
  ];

  if (variant === 'elevated') {
    cardStyle.push(SHADOWS.medium as ViewStyle);
  }

  return (
    <PaperCard style={[cardStyle, style]} {...props}>
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: SPACING.sm,
  },
});

export default CustomCard;
