// src/components/common/Input.tsx
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, TextInputProps, HelperText } from 'react-native-paper';
import { COLORS } from '../../styles/colors';
import { SPACING, DIMENSIONS } from '../../styles/spacing';
import { TYPOGRAPHY } from '../../styles/typography';

interface CustomInputProps extends Omit<TextInputProps, 'theme'> {
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  variant?: 'flat' | 'outlined';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  helperText?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  error,
  required = false,
  value,
  onChangeText,
  variant = 'outlined',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  helperText,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        label={required ? `${label} *` : label}
        placeholder={placeholder || label}
        value={value}
        onChangeText={onChangeText}
        mode={variant}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        error={!!error}
        style={[
          styles.input,
          multiline && { minHeight: DIMENSIONS.buttonHeight * 2 },
          style,
        ]}
        activeOutlineColor={COLORS.primary}
        outlineColor={COLORS.border.primary}
        contentStyle={styles.content}
        {...props}
      />
      {error && <HelperText type="error">{error}</HelperText>}
      {helperText && !error && <HelperText type="info">{helperText}</HelperText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.white,
    height: DIMENSIONS.inputHeight,
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
});

export default CustomInput;
