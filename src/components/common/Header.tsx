// src/components/common/Header.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Appbar, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../styles/colors';
import { SPACING, DIMENSIONS, SHADOWS } from '../../styles/spacing';
import { TYPOGRAPHY } from '../../styles/typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  menuOptions?: Array<{
    label: string;
    icon: string;
    onPress: () => void;
  }>;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  menuOptions,
}) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header
        style={styles.header}
        elevated
      >
        {showBack && (
          <Appbar.BackAction
            onPress={handleBack}
            color={COLORS.white}
          />
        )}
        <Appbar.Content
          title={title}
          subtitle={subtitle}
          titleStyle={styles.title}
          subtitleStyle={styles.subtitle}
          color={COLORS.white}
        />
        {rightAction && (
          <Appbar.Action
            icon={rightAction.icon}
            onPress={rightAction.onPress}
            color={COLORS.white}
          />
        )}
        {menuOptions && menuOptions.length > 0 && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
                color={COLORS.white}
              />
            }
          >
            {menuOptions.map((option, index) => (
              <Menu.Item
                key={index}
                title={option.label}
                leadingIcon={option.icon}
                onPress={() => {
                  option.onPress();
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        )}
      </Appbar.Header>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium as any,
  },
  header: {
    backgroundColor: COLORS.primary,
    height: DIMENSIONS.headerHeight + SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.white,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.extraLight,
  },
});

export default Header;
