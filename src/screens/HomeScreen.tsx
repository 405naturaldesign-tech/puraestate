// src/screens/HomeScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { fetchProperties, fetchFavorites } from '../redux/slices/propertiesSlice';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import { COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { formatCurrency } from '../utils/helpers';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: properties, status } = useAppSelector((state) => state.properties);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProperties({}));
    dispatch(fetchFavorites());
  }, [dispatch]);

  if (status === 'loading') {
    return <Loader />;
  }

  const featuredProperties = properties.slice(0, 3);

  return (
    <View style={styles.container}>
      <Header
        title="Welcome"
        subtitle={user?.firstName ? `Hi, ${user.firstName}!` : 'Hello!'}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight + '20' }]}>
            <Text style={styles.statValue}>{properties.length}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.secondary + '20' }]}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.tertiary + '20' }]}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>

          {featuredProperties.map((property) => (
            <Card key={property.id} style={styles.propertyCard}>
              <Card.Cover
                source={{ uri: property.images?.[0]?.url || 'https://via.placeholder.com/300' }}
                style={styles.propertyImage}
              />
              <Card.Content style={styles.cardContent}>
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {property.title}
                </Text>
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {property.address}
                </Text>
                <Text style={styles.propertyPrice}>
                  {formatCurrency(property.price)}
                </Text>
                <View style={styles.propertyStats}>
                  <Text style={styles.statText}>{property.bedrooms}bd</Text>
                  <Text style={styles.statText}>{property.bathrooms}ba</Text>
                  <Text style={styles.statText}>{property.squareFeet}sqft</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <Button
            mode="contained"
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            labelStyle={styles.actionButtonLabel}
            onPress={() => logger.info('AI Matching pressed')}
          >
            AI Matching (30 sec)
          </Button>

          <Button
            mode="outlined"
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            onPress={() => logger.info('Browse properties pressed')}
          >
            Browse All Properties
          </Button>

          <Button
            mode="outlined"
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            onPress={() => logger.info('Market analytics pressed')}
          >
            View Market Analytics
          </Button>
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.dark,
    marginBottom: SPACING.lg,
  },
  propertyCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  propertyImage: {
    height: 200,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  cardContent: {
    padding: SPACING.md,
  },
  propertyTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
  },
  propertyLocation: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  propertyPrice: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  propertyStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  statText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginRight: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
