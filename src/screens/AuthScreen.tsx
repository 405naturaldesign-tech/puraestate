// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { login, signUp } from '../redux/slices/authSlice';
import CustomInput from '../components/common/Input';
import CustomButton from '../components/common/Button';
import { COLORS } from '../styles/colors';
import { SPACING, DIMENSIONS as DIM } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { validateLoginForm, validateSignUpForm } from '../utils/validation';
import logger from '../utils/logger';

type AuthMode = 'login' | 'signup';

const { width } = Dimensions.get('window');

const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<AuthMode>('login');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up state
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');

  const handleLogin = async () => {
    const validation = validateLoginForm(loginEmail, loginPassword);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    try {
      await dispatch(login({ email: loginEmail, password: loginPassword })).unwrap();
      logger.info('Login successful');
    } catch (err) {
      logger.error('Login failed', err);
    }
  };

  const handleSignUp = async () => {
    const validation = validateSignUpForm({
      firstName: signUpFirstName,
      lastName: signUpLastName,
      email: signUpEmail,
      password: signUpPassword,
      confirmPassword: signUpConfirmPassword,
      phone: signUpPhone,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    try {
      await dispatch(
        signUp({
          firstName: signUpFirstName,
          lastName: signUpLastName,
          email: signUpEmail,
          password: signUpPassword,
          phone: signUpPhone,
          role: 'buyer',
        })
      ).unwrap();
      logger.info('Sign up successful');
    } catch (err) {
      logger.error('Sign up failed', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PuraEstate</Text>
          <Text style={styles.subtitle}>Find Your Perfect Property</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>

            <CustomInput
              label="Email"
              placeholder="you@example.com"
              value={loginEmail}
              onChangeText={setLoginEmail}
              error={formErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Password"
              placeholder="••••••••"
              value={loginPassword}
              onChangeText={setLoginPassword}
              error={formErrors.password}
              secureTextEntry
            />

            <CustomButton
              label={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => {
                setMode('signup');
                setFormErrors({});
              }}
            >
              <Text style={styles.toggleText}>
                Don't have an account? <Text style={styles.toggleLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>

            <CustomInput
              label="First Name"
              value={signUpFirstName}
              onChangeText={setSignUpFirstName}
              error={formErrors.firstName}
            />

            <CustomInput
              label="Last Name"
              value={signUpLastName}
              onChangeText={setSignUpLastName}
              error={formErrors.lastName}
            />

            <CustomInput
              label="Email"
              placeholder="you@example.com"
              value={signUpEmail}
              onChangeText={setSignUpEmail}
              error={formErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Phone"
              value={signUpPhone}
              onChangeText={setSignUpPhone}
              error={formErrors.phone}
              keyboardType="phone-pad"
            />

            <CustomInput
              label="Password"
              value={signUpPassword}
              onChangeText={setSignUpPassword}
              error={formErrors.password}
              secureTextEntry
              helperText="Min 8 chars, 1 upper, 1 lower, 1 number, 1 special char"
            />

            <CustomInput
              label="Confirm Password"
              value={signUpConfirmPassword}
              onChangeText={setSignUpConfirmPassword}
              error={formErrors.confirmPassword}
              secureTextEntry
            />

            <CustomButton
              label={isLoading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSignUp}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => {
                setMode('login');
                setFormErrors({});
              }}
            >
              <Text style={styles.toggleText}>
                Already have an account? <Text style={styles.toggleLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.huge,
    marginBottom: SPACING.xxxl,
  },
  logo: {
    ...TYPOGRAPHY.displaySmall,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    ...TYPOGRAPHY.bodySmall,
  },
  formContainer: {
    marginTop: SPACING.lg,
  },
  formTitle: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS.dark,
    marginBottom: SPACING.xl,
  },
  button: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  toggleText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  toggleLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default AuthScreen;
