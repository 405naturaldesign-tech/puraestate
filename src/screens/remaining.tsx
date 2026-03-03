// src/screens/AIMatchingScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Text, Card, Button, ProgressBar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';
import { COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS } from '../styles/spacing';
import { TYPOGRAPHY } from '../styles/typography';
import { formatCurrency } from '../utils/helpers';

const AIMatchingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isMatching, setIsMatching] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [matchProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate 30-second matching
    Animated.timing(matchProgress, {
      toValue: 100,
      duration: 30000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      setIsMatching(false);
      // Mock results
      setResults([
        {
          id: '1',
          title: 'Modern Downtown Loft',
          price: 450000,
          matchScore: 98,
          matchReasons: ['Perfect location match', 'Budget aligned', 'Luxury amenities'],
        },
        {
          id: '2',
          title: 'Family Home in Suburbs',
          price: 380000,
          matchScore: 94,
          matchReasons: ['Good schools', 'Space for family', 'Quiet neighborhood'],
        },
        {
          id: '3',
          title: 'Investment Property',
          price: 320000,
          matchScore: 87,
          matchReasons: ['High ROI potential', 'Rental income', 'Growing area'],
        },
      ]);
    }, 30000);
  }, []);

  if (isMatching) {
    return (
      <View style={styles.container}>
        <Header title="AI Matching" />
        <View style={styles.matchingContainer}>
          <MaterialCommunityIcons name="robot" size={64} color={COLORS.primary} />
          <Text style={styles.matchingTitle}>Finding Your Perfect Match...</Text>
          <Text style={styles.matchingSubtitle}>30 seconds remaining</Text>
          <ProgressBar
            progress={matchProgress.__getValue ? matchProgress.__getValue() / 100 : 0}
            style={styles.progressBar}
            color={COLORS.primary}
          />
          <Text style={styles.progressText}>Processing with AI...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="AI Matching Results" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.resultsTitle}>Your Top Matches</Text>
        <Text style={styles.resultsSubtitle}>Based on your preferences</Text>

        {results.map((result) => (
          <Card key={result.id} style={styles.resultCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.matchHeader}>
                <Text style={styles.propertyTitle}>{result.title}</Text>
                <View
                  style={[
                    styles.scoreCircle,
                    { backgroundColor: result.matchScore > 95 ? COLORS.success : COLORS.warning },
                  ]}
                >
                  <Text style={styles.scoreText}>{result.matchScore}%</Text>
                </View>
              </View>

              <Text style={styles.price}>{formatCurrency(result.price)}</Text>

              <ProgressBar
                progress={result.matchScore / 100}
                style={styles.matchBar}
                color={COLORS.primary}
              />

              <View style={styles.reasonsContainer}>
                {result.matchReasons.map((reason, index) => (
                  <Chip
                    key={index}
                    icon="check-circle"
                    style={styles.reasonChip}
                    label={reason}
                  />
                ))}
              </View>

              <Button
                mode="contained"
                style={styles.viewButton}
                onPress={() => console.log('View property')}
              >
                View Property
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

// src/screens/MyPropertiesScreen.tsx
const MyPropertiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const mockProperties = [
    {
      id: '1',
      title: 'Luxury Beach House',
      price: 850000,
      bedrooms: 4,
      bathrooms: 3,
      status: 'available',
      image: 'https://via.placeholder.com/300',
    },
    {
      id: '2',
      title: 'Downtown Apartment',
      price: 420000,
      bedrooms: 2,
      bathrooms: 2,
      status: 'rented',
      image: 'https://via.placeholder.com/300',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="My Properties" />
      <ScrollView contentContainerStyle={styles.content}>
        {mockProperties.map((prop) => (
          <Card key={prop.id} style={styles.propertyCard}>
            <Card.Cover source={{ uri: prop.image }} style={styles.cardImage} />
            <Card.Content style={styles.cardContent}>
              <Text style={styles.propertyTitle}>{prop.title}</Text>
              <Text style={styles.price}>{formatCurrency(prop.price)}</Text>
              <View style={styles.chipRow}>
                <Chip label={`${prop.bedrooms}bd`} style={styles.chip} />
                <Chip label={`${prop.bathrooms}ba`} style={styles.chip} />
              </View>
              <Button mode="contained" style={styles.actionBtn}>
                View Details
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

// src/screens/AgentsScreen.tsx
const AgentsScreen: React.FC = () => {
  const mockAgents = [
    {
      id: '1',
      name: 'Sarah Johnson',
      agency: 'Elite Realty',
      rating: 4.9,
      properties: 45,
      image: 'https://via.placeholder.com/100',
    },
    {
      id: '2',
      name: 'Michael Chen',
      agency: 'Prime Properties',
      rating: 4.8,
      properties: 38,
      image: 'https://via.placeholder.com/100',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Real Estate Agents" />
      <ScrollView contentContainerStyle={styles.content}>
        {mockAgents.map((agent) => (
          <Card key={agent.id} style={styles.agentCard}>
            <Card.Content style={styles.agentContent}>
              <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentAgency}>{agent.agency}</Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.rating}>{agent.rating}</Text>
                  <Text style={styles.properties}>• {agent.properties} properties</Text>
                </View>
              </View>
            </Card.Content>
            <Button mode="contained" style={styles.contactBtn}>
              Contact
            </Button>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

// src/screens/MarketAnalyticsScreen.tsx
const MarketAnalyticsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="Market Analytics" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Price</Text>
                <Text style={styles.statValue}>$520K</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Price Change</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>+3.2%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Market Trends</Text>
            <Text style={styles.trendItem}>• Strong buyer demand in downtown areas</Text>
            <Text style={styles.trendItem}>• Prices rising in suburban communities</Text>
            <Text style={styles.trendItem}>• Inventory levels stable YoY</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

// src/screens/ToolsScreen.tsx
const ToolsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const tools = [
    { id: '1', name: 'Mortgage Calculator', icon: 'calculator' },
    { id: '2', name: 'Property Valuation', icon: 'tag-multiple' },
    { id: '3', name: 'Market Comparables', icon: 'chart-line' },
    { id: '4', name: 'Affordability Checker', icon: 'check-circle' },
    { id: '5', name: 'Investment ROI', icon: 'percent' },
    { id: '6', name: 'Market Heat Map', icon: 'map' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Tools" />
      <ScrollView contentContainerStyle={styles.content}>
        {tools.map((tool) => (
          <Card
            key={tool.id}
            style={styles.toolCard}
            onPress={() => console.log('Open tool:', tool.name)}
          >
            <Card.Content style={styles.toolContent}>
              <MaterialCommunityIcons name={tool.icon as any} size={32} color={COLORS.primary} />
              <Text style={styles.toolName}>{tool.name}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

// Shared Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  // AI Matching
  matchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  matchingTitle: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS.dark,
    marginTop: SPACING.lg,
  },
  matchingSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  progressBar: {
    width: '80%',
    marginTop: SPACING.xl,
    height: 8,
  },
  progressText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.lg,
  },
  resultsTitle: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  resultsSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  resultCard: {
    marginBottom: SPACING.lg,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: COLORS.white,
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  propertyTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    flex: 1,
  },
  price: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  matchBar: {
    marginBottom: SPACING.lg,
    height: 6,
  },
  reasonsContainer: {
    marginBottom: SPACING.lg,
  },
  reasonChip: {
    marginBottom: SPACING.sm,
  },
  viewButton: {
    marginTop: SPACING.md,
  },
  propertyCard: {
    marginBottom: SPACING.lg,
  },
  cardImage: {
    height: 180,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  chip: {
    marginRight: SPACING.sm,
  },
  actionBtn: {
    marginTop: SPACING.md,
  },
  agentCard: {
    marginBottom: SPACING.lg,
  },
  agentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  agentInfo: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  agentName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
  },
  agentAgency: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  rating: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  properties: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  contactBtn: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  statValue: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  trendItem: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  toolCard: {
    marginBottom: SPACING.lg,
  },
  toolContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  toolName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.dark,
    marginLeft: SPACING.lg,
    flex: 1,
  },
});

export { AIMatchingScreen, MyPropertiesScreen, AgentsScreen, MarketAnalyticsScreen, ToolsScreen };
