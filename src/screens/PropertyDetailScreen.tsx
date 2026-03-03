// src/screens/PropertyDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Chip, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { fetchPropertyById, addFavorite, removeFavorite } from '../redux/slices/propertiesSlice';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import { COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { formatCurrency, calculatePricePerSqFt, calculateDaysOnMarket } from '../utils/helpers';

const { width } = Dimensions.get('window');

const PropertyDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const { propertyId } = route.params;
  const { currentProperty: property, status } = useAppSelector((state) => state.properties);
  const { favorites } = useAppSelector((state) => state.properties);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (propertyId) {
      dispatch(fetchPropertyById(propertyId));
    }
  }, [propertyId, dispatch]);

  useEffect(() => {
    if (property) {
      setIsFavorite(favorites.includes(property.id));
    }
  }, [property, favorites]);

  const handleToggleFavorite = () => {
    if (property) {
      if (isFavorite) {
        dispatch(removeFavorite(property.id));
      } else {
        dispatch(addFavorite(property.id));
      }
      setIsFavorite(!isFavorite);
    }
  };

  if (status === 'loading' || !property) {
    return <Loader />;
  }

  const pricePerSqFt = calculatePricePerSqFt(property.price, property.squareFeet);
  const daysOnMarket = calculateDaysOnMarket(property.listedDate);
  const images = property.images || [];

  return (
    <View style={styles.container}>
      <Header
        title="Property Details"
        showBack
        rightAction={{
          icon: isFavorite ? 'heart' : 'heart-outline',
          onPress: handleToggleFavorite,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Image Gallery */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: images[currentImageIndex]?.url || 'https://via.placeholder.com/300' }}
              style={styles.mainImage}
            />
            {images.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Price and Title */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>
          <Text style={styles.location}>{property.address}</Text>
        </View>

        {/* Key Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="door-open" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{property.bedrooms}</Text>
              <Text style={styles.statLabel}>Bedrooms</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="water" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{property.bathrooms}</Text>
              <Text style={styles.statLabel}>Bathrooms</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="ruler" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{property.squareFeet}</Text>
              <Text style={styles.statLabel}>Sqft</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="percent" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>${pricePerSqFt}</Text>
              <Text style={styles.statLabel}>Price/Sqft</Text>
            </View>
          </View>
        </Card>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Chip label={property.propertyType} />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Chip label={property.status} />
          </View>
          {property.yearBuilt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year Built:</Text>
              <Text style={styles.detailValue}>{property.yearBuilt}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Days on Market:</Text>
            <Text style={styles.detailValue}>{daysOnMarket} days</Text>
          </View>
        </View>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {property.amenities.map((amenity, index) => (
                <Chip key={index} style={styles.amenityChip} label={amenity} />
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {property.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        {/* Agent Info */}
        {property.agentName && (
          <Card style={styles.agentCard}>
            <View style={styles.agentContent}>
              <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{property.agentName}</Text>
                {property.agentEmail && (
                  <Text style={styles.agentContact}>{property.agentEmail}</Text>
                )}
                {property.agentPhone && (
                  <Text style={styles.agentContact}>{property.agentPhone}</Text>
                )}
              </View>
            </View>
            <Button mode="contained" style={styles.contactButton}>
              Contact Agent
            </Button>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => console.log('Schedule tour')}
          >
            Schedule Tour
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => console.log('Make offer')}
          >
            Make Offer
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
    paddingBottom: SPACING.xl,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: COLORS.extraLight,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.overlay40,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  imageIndicatorText: {
    color: COLORS.white,
    ...TYPOGRAPHY.labelMedium,
  },
  headerSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  title: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  price: {
    ...TYPOGRAPHY.displaySmall,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  location: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
  },
  statsCard: {
    margin: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    marginTop: SPACING.sm,
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  detailLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
  },
  detailValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.dark,
    fontWeight: '600',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityChip: {
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  agentCard: {
    margin: SPACING.lg,
  },
  agentContent: {
    flexDirection: 'row',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  agentInfo: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  agentName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
  },
  agentContact: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  contactButton: {
    margin: SPACING.lg,
    marginTop: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
  },
});

export default PropertyDetailScreen;
