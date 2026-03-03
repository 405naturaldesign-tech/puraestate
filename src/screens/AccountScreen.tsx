// src/screens/AccountScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, Divider, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import Header from '../components/common/Header';
import { COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { getInitials } from '../utils/helpers';
import logger from '../utils/logger';

const AccountScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await dispatch(logout());
          logger.info('User logged out');
        },
        style: 'destructive',
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => logger.info('Account deleted'),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Account Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={64}
              label={getInitials(user?.firstName || '', user?.lastName || '')}
              color={COLORS.white}
              style={{ backgroundColor: COLORS.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          <Button mode="outlined" style={styles.editButton}>
            Edit Profile
          </Button>
        </Card>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialCommunityIcons name="bell" size={24} color={COLORS.primary} />
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={COLORS.primary} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            </View>
          </Card>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <Card style={styles.menuCard}>
            <Button
              mode="text"
              icon="earth"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Language & Region
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="lock"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Privacy Settings
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="bell-alert"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Notification Preferences
            </Button>
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <Card style={styles.menuCard}>
            <Button
              mode="text"
              icon="help-circle"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Help & FAQ
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="file-document"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Terms of Service
            </Button>
            <Divider />
            <Button
              mode="text"
              icon="shield-account"
              contentStyle={styles.menuContent}
              labelStyle={styles.menuLabel}
              style={styles.menuButton}
            >
              Privacy Policy
            </Button>
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.aboutContent}>
              <Text style={styles.appName}>PuraEstate v1.0.0</Text>
              <Text style={styles.aboutText}>Build: 2024.02</Text>
              <Button
                mode="text"
                style={styles.aboutButton}
                labelStyle={styles.aboutButtonLabel}
              >
                Check for Updates
              </Button>
            </View>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Danger Zone</Text>

          <Button
            mode="contained"
            style={[styles.dangerButton, { backgroundColor: COLORS.error }]}
            labelStyle={styles.dangerButtonLabel}
            onPress={handleLogout}
          >
            Logout
          </Button>

          <Button
            mode="contained"
            style={[styles.dangerButton, { backgroundColor: COLORS.error }]}
            labelStyle={styles.dangerButtonLabel}
            onPress={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  profileCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileInfo: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
  },
  userEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  editButton: {
    marginTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  settingCard: {
    padding: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.dark,
    marginLeft: SPACING.md,
  },
  divider: {
    backgroundColor: COLORS.border.primary,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuButton: {
    justifyContent: 'flex-start',
    paddingVertical: SPACING.md,
  },
  menuContent: {
    justifyContent: 'flex-start',
  },
  menuLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.dark,
    marginLeft: SPACING.lg,
  },
  aboutCard: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  aboutContent: {
    alignItems: 'center',
  },
  appName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
  },
  aboutText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  aboutButton: {
    marginTop: SPACING.md,
  },
  aboutButtonLabel: {
    fontSize: 12,
  },
  dangerButton: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dangerButtonLabel: {
    fontSize: 14,
  },
  footer: {
    height: SPACING.xl,
  },
});

export default AccountScreen;
