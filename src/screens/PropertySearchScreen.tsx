// src/screens/PropertySearchScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Chip, Dialog, Portal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { fetchProperties, setCurrentProperty } from '../redux/slices/propertiesSlice';
import { updateFilter } from '../redux/slices/filtersSlice';
import Header from '../components/common/Header';
import CustomInput from '../components/common/Input';
import Loader from '../components/common/Loader';
import { COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { formatCurrency } from '../utils/helpers';
import { PROPERTY_TYPES, BEDROOM_OPTIONS, BATHROOM_OPTIONS } from '../utils/constants';

const { width } = Dimensions.get('window');

const PropertySearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { items: properties, status } = useAppSelector((state) => state.properties);
  const filters = useAppSelector((state) => state.filters.current);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  useEffect(() => {
    dispatch(fetchProperties({ ...filters }));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(
      updateFilter({
        key: 'priceMin',
        value: priceMin ? parseInt(priceMin) : undefined,
      })
    );
    dispatch(
      updateFilter({
        key: 'priceMax',
        value: priceMax ? parseInt(priceMax) : undefined,
      })
    );
    dispatch(
      updateFilter({
        key: 'bedrooms',
        value: bedrooms ? parseInt(bedrooms) : undefined,
      })
    );
    dispatch(
      updateFilter({
        key: 'propertyType',
        value: propertyType || undefined,
      })
    );
  };

  const handlePropertyPress = (property: any) => {
    dispatch(setCurrentProperty(property));
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  if (status === 'loading') {
    return <Loader />;
  }

  const renderPropertyCard = ({ item: property }: { item: any }) => (
    <TouchableOpacity onPress={() => handlePropertyPress(property)}>
      <Card style={styles.propertyCard}>
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
            <Chip
              icon="door"
              style={styles.chip}
              compact
              label={`${property.bedrooms}bd`}
            />
            <Chip
              icon="water"
              style={styles.chip}
              compact
              label={`${property.bathrooms}ba`}
            />
            <Chip
              icon="ruler"
              style={styles.chip}
              compact
              label={`${property.squareFeet}sqft`}
            />
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Search Properties" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <CustomInput
          label="Search by location, type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>{properties.length} Properties Found</Text>
      </View>

      <FlatList
        data={properties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Portal>
        <Dialog
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          style={styles.modal}
        >
          <Dialog.Title>Filters</Dialog.Title>
          <Dialog.Content>
            <ScrollView nestedScrollEnabled>
              <CustomInput
                label="Price Min"
                value={priceMin}
                onChangeText={setPriceMin}
                keyboardType="number-pad"
              />
              <CustomInput
                label="Price Max"
                value={priceMax}
                onChangeText={setPriceMax}
                keyboardType="number-pad"
              />
              <CustomInput
                label="Bedrooms"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="number-pad"
              />

              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.filterChips}>
                {PROPERTY_TYPES.map((type) => (
                  <Chip
                    key={type.value}
                    selected={propertyType === type.value}
                    onPress={() => setPropertyType(propertyType === type.value ? '' : type.value)}
                    style={styles.typeChip}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowFilterModal(false)}>Cancel</Button>
            <Button
              onPress={() => {
                handleSearch();
                setShowFilterModal(false);
              }}
            >
              Apply
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    marginLeft: SPACING.md,
    padding: SPACING.md,
  },
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  resultsText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  propertyCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  propertyImage: {
    height: 200,
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
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.secondary,
  },
  modal: {
    maxHeight: '80%',
  },
  filterLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.dark,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeChip: {
    marginBottom: SPACING.sm,
  },
});

export default PropertySearchScreen;
