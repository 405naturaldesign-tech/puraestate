import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAppStore, Property, Transaction } from '../store/store';
import CurrencyConverter from '../utils/currency';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PortfolioMetrics {
  totalProperties: number;
  totalValue: number;
  totalEquity: number;
  totalMortgages: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  averageCapRate: number;
  overallROI: number;
  diversification: {
    byType: Record<string, number>;
    byLocation: Record<string, number>;
  };
}

interface PropertyPerformance {
  propertyId: string;
  name: string;
  value: number;
  monthlyRent: number;
  expenses: number;
  cashFlow: number;
  capRate: number;
  type: string;
  currency: string;
}

const PortfolioAnalytics: React.FC = () => {
  const { properties, transactions, currency } = useAppStore();
  const [timeFrame, setTimeFrame] = useState<'month' | 'quarter' | 'year' | 'all'>('year');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    properties.length > 0 ? properties[0] : null
  );

  const metrics = useMemo(() => {
    const calc: PortfolioMetrics = {
      totalProperties: properties.length,
      totalValue: 0,
      totalEquity: 0,
      totalMortgages: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netCashFlow: 0,
      averageCapRate: 0,
      overallROI: 0,
      diversification: {
        byType: {},
        byLocation: {},
      },
    };

    let capRateSum = 0;
    let capRateCount = 0;

    properties.forEach((property) => {
      calc.totalValue += property.price;

      // Diversification by type
      const typeCount = calc.diversification.byType[property.type] || 0;
      calc.diversification.byType[property.type] = typeCount + 1;

      // Calculate property metrics
      const propertyTransactions = transactions.filter(
        (t) => t.propertyId === property.id
      );

      const rentIncome = propertyTransactions
        .filter((t) => t.type === 'rent' && isInTimeFrame(t.date))
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = propertyTransactions
        .filter((t) => t.type === 'expense' && isInTimeFrame(t.date))
        .reduce((sum, t) => sum + t.amount, 0);

      if (rentIncome > 0) {
        const capRate = (rentIncome / property.price) * 100;
        capRateSum += capRate;
        capRateCount++;
      }

      calc.monthlyIncome += rentIncome / getMonthsInFrame();
      calc.monthlyExpenses += expenses / getMonthsInFrame();
    });

    calc.netCashFlow = calc.monthlyIncome - calc.monthlyExpenses;
    calc.averageCapRate = capRateCount > 0 ? capRateSum / capRateCount : 0;
    calc.overallROI = calc.totalValue > 0
      ? ((calc.monthlyIncome * 12) / calc.totalValue) * 100
      : 0;

    return calc;
  }, [properties, transactions, timeFrame]);

  const propertyPerformance = useMemo(() => {
    return properties
      .map((property) => {
        const propertyTransactions = transactions.filter(
          (t) => t.propertyId === property.id
        );

        const rentIncome = propertyTransactions
          .filter((t) => t.type === 'rent')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = propertyTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const capRate = property.price > 0
          ? ((rentIncome * 12) / property.price) * 100
          : 0;

        return {
          propertyId: property.id,
          name: property.name,
          value: property.price,
          monthlyRent: rentIncome / 12,
          expenses: expenses / 12,
          cashFlow: (rentIncome - expenses) / 12,
          capRate,
          type: property.type,
          currency: property.currency,
        } as PropertyPerformance;
      })
      .sort((a, b) => b.value - a.value);
  }, [properties, transactions]);

  const isInTimeFrame = (date: number): boolean => {
    const transDate = new Date(date);
    const now = new Date();

    switch (timeFrame) {
      case 'month':
        return (
          transDate.getMonth() === now.getMonth() &&
          transDate.getFullYear() === now.getFullYear()
        );
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const transQuarter = Math.floor(transDate.getMonth() / 3);
        return (
          quarter === transQuarter &&
          transDate.getFullYear() === now.getFullYear()
        );
      case 'year':
        return transDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const getMonthsInFrame = (): number => {
    switch (timeFrame) {
      case 'month':
        return 1;
      case 'quarter':
        return 3;
      case 'year':
        return 12;
      default:
        return 12;
    }
  };

  const exportAnalytics = async () => {
    try {
      const csvContent = generateAnalyticsCSV();
      const fileName = `Portfolio_Analytics_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const generateAnalyticsCSV = (): string => {
    const lines = [
      'PORTFOLIO ANALYTICS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Time Frame: ${timeFrame.toUpperCase()}`,
      '',
      'PORTFOLIO SUMMARY',
      `Total Properties: ${metrics.totalProperties}`,
      `Total Portfolio Value: ${CurrencyConverter.format(metrics.totalValue, currency)}`,
      `Monthly Income: ${CurrencyConverter.format(metrics.monthlyIncome, currency)}`,
      `Monthly Expenses: ${CurrencyConverter.format(metrics.monthlyExpenses, currency)}`,
      `Net Cash Flow: ${CurrencyConverter.format(metrics.netCashFlow, currency)}`,
      `Average Cap Rate: ${metrics.averageCapRate.toFixed(2)}%`,
      `Overall ROI: ${metrics.overallROI.toFixed(2)}%`,
      '',
      'PROPERTY BREAKDOWN',
      'Property,Value,Monthly Rent,Expenses,Cash Flow,Cap Rate',
      ...propertyPerformance.map((prop) =>
        `"${prop.name}","${prop.value}","${prop.monthlyRent.toFixed(2)}","${prop.expenses.toFixed(2)}","${prop.cashFlow.toFixed(2)}","${prop.capRate.toFixed(2)}%"`
      ),
    ];

    return lines.join('\n');
  };

  const renderPropertyItem = ({ item }: { item: PropertyPerformance }) => (
    <TouchableOpacity
      style={[
        styles.propertyCard,
        selectedProperty?.id === item.propertyId && styles.propertyCardSelected,
      ]}
      onPress={() => {
        const prop = properties.find((p) => p.id === item.propertyId);
        setSelectedProperty(prop || null);
      }}
    >
      <View style={styles.propertyHeader}>
        <View>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyType}>{item.type}</Text>
        </View>
        <View
          style={[
            styles.capRateBadge,
            item.capRate > 5 && styles.capRateBadgeHigh,
          ]}
        >
          <Text style={styles.capRateText}>{item.capRate.toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.propertyMetrics}>
        <View style={styles.propertyMetric}>
          <Text style={styles.metricLabel}>Value</Text>
          <Text style={styles.metricValue}>
            {CurrencyConverter.format(item.value, item.currency)}
          </Text>
        </View>
        <View style={styles.propertyMetric}>
          <Text style={styles.metricLabel}>Monthly Rent</Text>
          <Text style={[styles.metricValue, { color: '#34C759' }]}>
            {CurrencyConverter.format(item.monthlyRent, item.currency)}
          </Text>
        </View>
        <View style={styles.propertyMetric}>
          <Text style={styles.metricLabel}>Cash Flow</Text>
          <Text
            style={[
              styles.metricValue,
              item.cashFlow < 0 && { color: '#FF3B30' },
            ]}
          >
            {CurrencyConverter.format(item.cashFlow, item.currency)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Analytics</Text>

        <View style={styles.timeFrameContainer}>
          {['month', 'quarter', 'year', 'all'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeFrameButton,
                timeFrame === tf && styles.timeFrameButtonActive,
              ]}
              onPress={() => setTimeFrame(tf as any)}
            >
              <Text
                style={[
                  styles.timeFrameButtonText,
                  timeFrame === tf && styles.timeFrameButtonTextActive,
                ]}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Portfolio Value</Text>
          <Text style={styles.metricCardValue}>
            {CurrencyConverter.format(metrics.totalValue, currency)}
          </Text>
          <Text style={styles.metricCardSubtext}>
            {metrics.totalProperties} {metrics.totalProperties === 1 ? 'property' : 'properties'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Monthly Income</Text>
          <Text style={[styles.metricCardValue, { color: '#34C759' }]}>
            {CurrencyConverter.format(metrics.monthlyIncome, currency)}
          </Text>
          <Text style={styles.metricCardSubtext}>Gross rental income</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Net Cash Flow</Text>
          <Text
            style={[
              styles.metricCardValue,
              metrics.netCashFlow < 0 && { color: '#FF3B30' },
            ]}
          >
            {CurrencyConverter.format(metrics.netCashFlow, currency)}
          </Text>
          <Text style={styles.metricCardSubtext}>After expenses</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Average Cap Rate</Text>
          <Text style={[styles.metricCardValue, { color: '#FF9500' }]}>
            {metrics.averageCapRate.toFixed(2)}%
          </Text>
          <Text style={styles.metricCardSubtext}>Portfolio average</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Overall ROI</Text>
          <Text style={[styles.metricCardValue, { color: '#007AFF' }]}>
            {metrics.overallROI.toFixed(2)}%
          </Text>
          <Text style={styles.metricCardSubtext}>Annual return</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Monthly Expenses</Text>
          <Text style={[styles.metricCardValue, { color: '#FF3B30' }]}>
            {CurrencyConverter.format(metrics.monthlyExpenses, currency)}
          </Text>
          <Text style={styles.metricCardSubtext}>Operating costs</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Properties</Text>
          <TouchableOpacity onPress={exportAnalytics}>
            <Text style={styles.exportLink}>Export</Text>
          </TouchableOpacity>
        </View>

        {properties.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={propertyPerformance}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.propertyId}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No properties yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first property to start tracking performance
            </Text>
          </View>
        )}
      </View>

      {selectedProperty && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>{selectedProperty.name} - Details</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>Address</Text>
              <Text style={styles.detailsValue}>{selectedProperty.address}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>Type</Text>
              <Text style={styles.detailsValue}>{selectedProperty.type}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>Purchase Price</Text>
              <Text style={styles.detailsValue}>
                {CurrencyConverter.format(selectedProperty.price, selectedProperty.currency)}
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>Added</Text>
              <Text style={styles.detailsValue}>
                {new Date(selectedProperty.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {selectedProperty.data && (
            <View style={styles.customData}>
              <Text style={styles.detailsLabel}>Custom Data</Text>
              <Text style={styles.customDataText}>
                {JSON.stringify(selectedProperty.data, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Key Insights</Text>

        {metrics.netCashFlow > 0 ? (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>✓</Text>
            <Text style={styles.insightText}>
              Your portfolio is cash flow positive. Net monthly income: {CurrencyConverter.format(metrics.netCashFlow, currency)}
            </Text>
          </View>
        ) : (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>⚠</Text>
            <Text style={styles.insightText}>
              Your portfolio is cash flow negative. Review expenses or consider adjusting rents.
            </Text>
          </View>
        )}

        {metrics.averageCapRate > 5 ? (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>✓</Text>
            <Text style={styles.insightText}>
              Strong cap rates. Average: {metrics.averageCapRate.toFixed(2)}%
            </Text>
          </View>
        ) : (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>!</Text>
            <Text style={styles.insightText}>
              Cap rates below 5%. Consider markets with better yields.
            </Text>
          </View>
        )}

        {metrics.totalProperties > 1 ? (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>✓</Text>
            <Text style={styles.insightText}>
              Good diversification. {metrics.totalProperties} properties spread across different assets.
            </Text>
          </View>
        ) : null}
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
    marginBottom: 16,
    color: '#333',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  timeFrameButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeFrameButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timeFrameButtonTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginRight: '4%',
    marginBottom: 12,
  },
  metricCardLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  metricCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  metricCardSubtext: {
    fontSize: 10,
    color: '#ccc',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  exportLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  propertyCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  propertyType: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  capRateBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  capRateBadgeHigh: {
    backgroundColor: '#d4edda',
  },
  capRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#856404',
  },
  propertyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailsCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: '4%',
    marginBottom: 10,
  },
  detailsLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  customData: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  customDataText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default PortfolioAnalytics;
