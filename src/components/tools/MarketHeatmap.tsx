import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface CantonData {
  id: string;
  name: string;
  pricePerM2: number;
  averagePrice: number;
  demand: 'high' | 'medium' | 'low';
  priceChange: number; // percentage
  inventory: number; // number of listings
  daysOnMarket: number;
  neighborhoods: Array<{
    name: string;
    pricePerM2: number;
    demand: 'high' | 'medium' | 'low';
    amenities: string[];
  }>;
}

const CANTON_DATA: CantonData[] = [
  {
    id: 'sj-sj',
    name: 'San José (Centro)',
    pricePerM2: 3500,
    averagePrice: 250000,
    demand: 'high',
    priceChange: 5.2,
    inventory: 245,
    daysOnMarket: 45,
    neighborhoods: [
      {
        name: 'Barrio Escalante',
        pricePerM2: 4200,
        demand: 'high',
        amenities: ['Restaurants', 'Galleries', 'Nightlife', 'Urban Living'],
      },
      {
        name: 'Los Yoses',
        pricePerM2: 3800,
        demand: 'high',
        amenities: ['University Area', 'Cultural', 'Trendy', 'Safe'],
      },
      {
        name: 'San Pedro',
        pricePerM2: 3600,
        demand: 'medium',
        amenities: ['Student District', 'Vibrant', 'Young Population', 'Affordable'],
      },
    ],
  },
  {
    id: 'sjd-sj',
    name: 'San José (Suburbs)',
    pricePerM2: 2800,
    averagePrice: 180000,
    demand: 'medium',
    priceChange: 3.1,
    inventory: 320,
    daysOnMarket: 55,
    neighborhoods: [
      {
        name: 'La Uruca',
        pricePerM2: 2600,
        demand: 'medium',
        amenities: ['Modern Area', 'Shopping', 'Business District', 'Infrastructure'],
      },
      {
        name: 'San Isidro de El General',
        pricePerM2: 2400,
        demand: 'low',
        amenities: ['Rural', 'Agriculture', 'Peaceful', 'Nature'],
      },
    ],
  },
  {
    id: 'ebais',
    name: 'Escazú & Bello Horizonte',
    pricePerM2: 5200,
    averagePrice: 450000,
    demand: 'high',
    priceChange: 6.8,
    inventory: 180,
    daysOnMarket: 35,
    neighborhoods: [
      {
        name: 'Escazú Proper',
        pricePerM2: 5500,
        demand: 'high',
        amenities: ['Luxury', 'Shopping', 'Restaurants', 'Expat Community'],
      },
      {
        name: 'Bello Horizonte',
        pricePerM2: 4900,
        demand: 'high',
        amenities: ['Luxury Residential', 'Safe', 'Private Communities', 'Modern'],
      },
    ],
  },
  {
    id: 'spm',
    name: 'San Pedro de Montes de Oca',
    pricePerM2: 4100,
    averagePrice: 320000,
    demand: 'high',
    priceChange: 4.5,
    inventory: 210,
    daysOnMarket: 40,
    neighborhoods: [
      {
        name: 'Montes de Oca Center',
        pricePerM2: 4300,
        demand: 'high',
        amenities: ['Green', 'Safe', 'Family-Friendly', 'Close to University'],
      },
    ],
  },
  {
    id: 'sn',
    name: 'Santa Ana',
    pricePerM2: 3200,
    averagePrice: 220000,
    demand: 'medium',
    priceChange: 2.8,
    inventory: 290,
    daysOnMarket: 50,
    neighborhoods: [
      {
        name: 'Santa Ana Proper',
        pricePerM2: 3400,
        demand: 'medium',
        amenities: ['Trendy', 'Young Market', 'Growing', 'Creative Community'],
      },
    ],
  },
  {
    id: 'cp',
    name: 'Curridabat & Patio de Agua',
    pricePerM2: 3600,
    averagePrice: 280000,
    demand: 'medium',
    priceChange: 3.5,
    inventory: 200,
    daysOnMarket: 48,
    neighborhoods: [
      {
        name: 'Curridabat Center',
        pricePerM2: 3800,
        demand: 'medium',
        amenities: ['Commercial Hub', 'Mixed-Use', 'Accessible', 'Growing'],
      },
    ],
  },
  {
    id: 'os',
    name: 'Óscar San',
    pricePerM2: 2200,
    averagePrice: 150000,
    demand: 'low',
    priceChange: 1.2,
    inventory: 350,
    daysOnMarket: 65,
    neighborhoods: [
      {
        name: 'Óscar San Center',
        pricePerM2: 2400,
        demand: 'low',
        amenities: ['Affordable', 'Residential', 'Growing', 'Investment Potential'],
      },
    ],
  },
  {
    id: 'liberia',
    name: 'Liberia & Gold Coast',
    pricePerM2: 2800,
    averagePrice: 200000,
    demand: 'high',
    priceChange: 7.5,
    inventory: 150,
    daysOnMarket: 42,
    neighborhoods: [
      {
        name: 'Playas del Coco',
        pricePerM2: 3200,
        demand: 'high',
        amenities: ['Beach', 'Tourism', 'Restaurants', 'Water Sports'],
      },
      {
        name: 'Tamarindo',
        pricePerM2: 4500,
        demand: 'high',
        amenities: ['Beach Resort', 'Nightlife', 'Expat Hub', 'Luxury'],
      },
    ],
  },
  {
    id: 'manuel_antonio',
    name: 'Manuel Antonio',
    pricePerM2: 3800,
    averagePrice: 300000,
    demand: 'high',
    priceChange: 8.2,
    inventory: 120,
    daysOnMarket: 38,
    neighborhoods: [
      {
        name: 'Manuel Antonio Proper',
        pricePerM2: 4200,
        demand: 'high',
        amenities: ['Beach Paradise', 'Nature', 'Tourism', 'Expats'],
      },
    ],
  },
];

const MarketHeatmap: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'price' | 'demand' | 'change'>('price');
  const [selectedCanton, setSelectedCanton] = useState<CantonData | null>(CANTON_DATA[0]);
  const [sortBy, setSortBy] = useState<'price' | 'demand' | 'change'>('price');

  const getDemandColor = (demand: 'high' | 'medium' | 'low'): string => {
    switch (demand) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const getPriceColor = (price: number, min: number, max: number): string => {
    const ratio = (price - min) / (max - min);
    if (ratio > 0.66) return '#FF3B30';
    if (ratio > 0.33) return '#FF9500';
    return '#34C759';
  };

  const getPriceChangeColor = (change: number): string => {
    if (change > 5) return '#FF3B30';
    if (change > 2) return '#FF9500';
    return '#34C759';
  };

  const minPrice = Math.min(...CANTON_DATA.map((c) => c.pricePerM2));
  const maxPrice = Math.max(...CANTON_DATA.map((c) => c.pricePerM2));

  const sortedCantons = [...CANTON_DATA].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.pricePerM2 - a.pricePerM2;
      case 'demand':
        const demandOrder = { high: 3, medium: 2, low: 1 };
        return (demandOrder[b.demand] || 0) - (demandOrder[a.demand] || 0);
      case 'change':
        return b.priceChange - a.priceChange;
      default:
        return 0;
    }
  });

  const renderCantonCard = ({ item }: { item: CantonData }) => (
    <TouchableOpacity
      style={[
        styles.cantonCard,
        selectedCanton?.id === item.id && styles.cantonCardSelected,
      ]}
      onPress={() => setSelectedCanton(item)}
    >
      <View style={styles.cantonHeader}>
        <Text style={styles.cantonName}>{item.name}</Text>
        <View
          style={[
            styles.demandBadge,
            { backgroundColor: getDemandColor(item.demand) },
          ]}
        >
          <Text style={styles.demandBadgeText}>{item.demand.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cantonMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Price/m²</Text>
          <Text style={[styles.metricValue, { color: getPriceColor(item.pricePerM2, minPrice, maxPrice) }]}>
            ${item.pricePerM2.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Avg. Price</Text>
          <Text style={styles.metricValue}>
            ${(item.averagePrice / 1000).toFixed(0)}k
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>YoY Change</Text>
          <Text style={[styles.metricValue, { color: getPriceChangeColor(item.priceChange) }]}>
            {item.priceChange > 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.cantonStats}>
        <Text style={styles.statText}>
          📊 {item.inventory} listings • {item.daysOnMarket} days avg
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Heatmap</Text>
        <Text style={styles.subtitle}>Price trends and demand analysis</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Sort By</Text>
          <Picker
            selectedValue={sortBy}
            onValueChange={setSortBy}
            style={styles.picker}
          >
            <Picker.Item label="Price/m²" value="price" />
            <Picker.Item label="Demand Level" value="demand" />
            <Picker.Item label="Price Change" value="change" />
          </Picker>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>High/Hot</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>Low/Bargain</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>All Markets</Text>
        <FlatList
          scrollEnabled={false}
          data={sortedCantons}
          renderItem={renderCantonCard}
          keyExtractor={(item) => item.id}
        />
      </View>

      {selectedCanton && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>{selectedCanton.name} - Neighborhoods</Text>

          {selectedCanton.neighborhoods.map((neighborhood, index) => (
            <View key={index} style={styles.neighborhoodCard}>
              <View style={styles.neighborhoodHeader}>
                <Text style={styles.neighborhoodName}>{neighborhood.name}</Text>
                <View
                  style={[
                    styles.demandBadge,
                    { backgroundColor: getDemandColor(neighborhood.demand) },
                  ]}
                >
                  <Text style={styles.demandBadgeText}>{neighborhood.demand.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.neighborhoodPrice}>
                ${neighborhood.pricePerM2.toLocaleString()}/m²
              </Text>

              <View style={styles.amenitiesContainer}>
                {neighborhood.amenities.map((amenity, amenityIndex) => (
                  <View key={amenityIndex} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Market Statistics</Text>

        <View style={styles.statCard}>
          <Text style={styles.statCardTitle}>Highest Demand</Text>
          <Text style={styles.statCardValue}>
            {CANTON_DATA.filter((c) => c.demand === 'high').length} markets
          </Text>
          <Text style={styles.statCardLabel}>
            {CANTON_DATA.filter((c) => c.demand === 'high')
              .map((c) => c.name)
              .slice(0, 2)
              .join(', ')}
            ...
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardTitle}>Best Values</Text>
          <Text style={styles.statCardValue}>
            ${Math.min(...CANTON_DATA.map((c) => c.pricePerM2)).toLocaleString()}/m²
          </Text>
          <Text style={styles.statCardLabel}>
            {CANTON_DATA.find((c) => c.pricePerM2 === Math.min(...CANTON_DATA.map((c) => c.pricePerM2)))?.name}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardTitle}>Fastest Growing</Text>
          <Text style={styles.statCardValue}>
            +{Math.max(...CANTON_DATA.map((c) => c.priceChange)).toFixed(1)}%
          </Text>
          <Text style={styles.statCardLabel}>
            {CANTON_DATA.find((c) => c.priceChange === Math.max(...CANTON_DATA.map((c) => c.priceChange)))?.name}
          </Text>
        </View>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Market Insights</Text>
        <Text style={styles.tipsText}>
          • San José Center and Escazú command premium prices due to location and amenities
        </Text>
        <Text style={styles.tipsText}>
          • Beach properties (Manuel Antonio, Tamarindo) show highest growth
        </Text>
        <Text style={styles.tipsText}>
          • Suburban areas offer better value for long-term investments
        </Text>
        <Text style={styles.tipsText}>
          • Off-season (May-November) typically offers better negotiation opportunities
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  controls: {
    padding: 16,
  },
  controlGroup: {
    marginBottom: 0,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  cantonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cantonCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  cantonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cantonName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  demandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  demandBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cantonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  cantonStats: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  detailsSection: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  neighborhoodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  neighborhoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  neighborhoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  neighborhoodPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 10,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
  statsSection: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
  },
  tipsSection: {
    backgroundColor: '#f0f8ff',
    margin: 16,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 18,
    marginBottom: 8,
  },
});

export default MarketHeatmap;
