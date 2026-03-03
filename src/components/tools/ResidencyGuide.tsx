import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface ResidencyCategory {
  id: string;
  name: string;
  monthlyIncome?: number;
  lumpSum?: number;
  description: string;
  benefits: string[];
  requirements: string[];
  processingTime: string;
  cost: number;
  currency: string;
}

const RESIDENCY_OPTIONS: ResidencyCategory[] = [
  {
    id: 'pensionado',
    name: 'Pensionado (Pensioner)',
    monthlyIncome: 1000,
    description:
      'For retirees with a guaranteed monthly pension or income. Most popular option for foreign retirees.',
    benefits: [
      'Guaranteed income requirement only',
      'Spouse and dependent children eligible',
      'Can import household items tax-free',
      'Access to national healthcare system',
      'Permanent residency after 3 years',
    ],
    requirements: [
      'Minimum monthly income of $1,000 USD (guaranteed)',
      'Valid passport',
      'Criminal background check (no convictions)',
      'Proof of income (pension statement, social security letter, etc.)',
      'Medical exam',
      'Rental agreement or property deed',
    ],
    processingTime: '30-60 days',
    cost: 250,
    currency: 'USD',
  },
  {
    id: 'rentista',
    name: 'Rentista (Investor)',
    lumpSum: 250000,
    description:
      'For investors who can demonstrate capital investment. Requires one-time deposit in Costa Rican bank.',
    benefits: [
      'Access to investment opportunities',
      'Self-sufficient status',
      'Can work as independent contractor',
      'Family members eligible',
      'Permanent residency after 3 years',
    ],
    requirements: [
      'Minimum lump sum deposit of $250,000 USD in Costa Rican bank',
      'Money must remain in bank for entire visa validity',
      'Valid passport',
      'Criminal background check',
      'Medical exam',
      'Rental agreement or property deed',
    ],
    processingTime: '45-90 days',
    cost: 500,
    currency: 'USD',
  },
  {
    id: 'investor',
    name: 'Investor Visa',
    lumpSum: 150000,
    description:
      'For those who invest in approved business activities or real estate development projects.',
    benefits: [
      'Lower capital requirement than Rentista',
      'Can generate business income',
      'Employment opportunities',
      'Fast-track approval possible',
      'Permanent residency after 3 years',
    ],
    requirements: [
      'Minimum $150,000 USD investment in approved project',
      'Detailed business plan',
      'Valid passport',
      'Criminal background check',
      'Medical exam',
      'Economic and financial statements',
    ],
    processingTime: '60-120 days',
    cost: 750,
    currency: 'USD',
  },
  {
    id: 'temporal',
    name: 'Temporal (Temporary Resident)',
    monthlyIncome: 500,
    description:
      'For individuals with some income. Good for freelancers, remote workers, and early retirees.',
    benefits: [
      'Lower monthly income requirement',
      'Flexible visa option',
      'Can be renewed for up to 3 years',
      'Access to healthcare',
      'Legal residency status',
    ],
    requirements: [
      'Minimum monthly income of $500 USD (can be from various sources)',
      'Valid passport',
      'Criminal background check',
      'Proof of income',
      'Medical exam',
      'Accommodation proof',
    ],
    processingTime: '30-45 days',
    cost: 200,
    currency: 'USD',
  },
  {
    id: 'special',
    name: 'Special Categories',
    description:
      'Includes digital nomads, retirees with lower income, religious workers, and other special cases.',
    benefits: [
      'Tailored for specific professions',
      'May have reduced financial requirements',
      'Flexibility for special circumstances',
      'Access to services and benefits',
    ],
    requirements: [
      'Varies by category',
      'Valid passport',
      'Criminal background check',
      'Proof of applicable status',
      'Medical exam',
    ],
    processingTime: '30-90 days',
    cost: 200,
    currency: 'USD',
  },
];

const ResidencyGuide: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ResidencyCategory | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const toggleComparison = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter((item) => item !== id));
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison([...selectedForComparison, id]);
    }
  };

  const getComparisonData = () => {
    return RESIDENCY_OPTIONS.filter((option) => selectedForComparison.includes(option.id));
  };

  const renderCategoryCard = ({ item }: { item: ResidencyCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory?.id === item.id && styles.categoryCardSelected,
      ]}
      onPress={() => {
        if (comparisonMode) {
          toggleComparison(item.id);
        } else {
          setSelectedCategory(item);
        }
      }}
    >
      {comparisonMode && (
        <View
          style={[
            styles.checkbox,
            selectedForComparison.includes(item.id) && styles.checkboxChecked,
          ]}
        >
          {selectedForComparison.includes(item.id) && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      )}

      <Text style={styles.categoryName}>{item.name}</Text>

      {item.monthlyIncome && (
        <Text style={styles.categoryRequirement}>
          💰 ${item.monthlyIncome}/month
        </Text>
      )}
      {item.lumpSum && (
        <Text style={styles.categoryRequirement}>
          💰 ${item.lumpSum.toLocaleString()} lump sum
        </Text>
      )}

      <Text style={styles.categoryDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Costa Rica Residency Guide</Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !comparisonMode && styles.modeButtonActive]}
            onPress={() => {
              setComparisonMode(false);
              setSelectedForComparison([]);
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                !comparisonMode && styles.modeButtonTextActive,
              ]}
            >
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, comparisonMode && styles.modeButtonActive]}
            onPress={() => setComparisonMode(true)}
          >
            <Text
              style={[
                styles.modeButtonText,
                comparisonMode && styles.modeButtonTextActive,
              ]}
            >
              Compare
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {!comparisonMode ? (
          <>
            <Text style={styles.sectionTitle}>Residency Options</Text>
            <FlatList
              scrollEnabled={false}
              data={RESIDENCY_OPTIONS}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
            />

            {selectedCategory && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>{selectedCategory.name}</Text>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsLabel}>Overview</Text>
                  <Text style={styles.detailsText}>{selectedCategory.description}</Text>
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsLabel}>Financial Requirements</Text>
                  {selectedCategory.monthlyIncome && (
                    <Text style={styles.detailsText}>
                      • Monthly Income: ${selectedCategory.monthlyIncome.toLocaleString()} USD
                    </Text>
                  )}
                  {selectedCategory.lumpSum && (
                    <Text style={styles.detailsText}>
                      • Lump Sum: ${selectedCategory.lumpSum.toLocaleString()} USD
                    </Text>
                  )}
                  <Text style={styles.detailsText}>
                    • Processing Cost: ${selectedCategory.cost} {selectedCategory.currency}
                  </Text>
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsLabel}>Key Requirements</Text>
                  {selectedCategory.requirements.map((req, index) => (
                    <Text key={index} style={styles.listItem}>
                      ✓ {req}
                    </Text>
                  ))}
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsLabel}>Benefits</Text>
                  {selectedCategory.benefits.map((benefit, index) => (
                    <Text key={index} style={styles.listItem}>
                      ✓ {benefit}
                    </Text>
                  ))}
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsLabel}>Processing Time</Text>
                  <Text style={styles.detailsText}>{selectedCategory.processingTime}</Text>
                </View>

                <View style={styles.tipsCard}>
                  <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
                  <Text style={styles.tipsText}>
                    • Apply through the Immigration Ministry (DGME) or authorized attorney
                  </Text>
                  <Text style={styles.tipsText}>
                    • Have all documents certified and apostilled if from abroad
                  </Text>
                  <Text style={styles.tipsText}>
                    • Consider consulting with immigration lawyer for complex cases
                  </Text>
                  <Text style={styles.tipsText}>
                    • Can transition to permanent residency after 3 years on any visa
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Select up to 3 options to compare</Text>
            <FlatList
              scrollEnabled={false}
              data={RESIDENCY_OPTIONS}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
            />

            {selectedForComparison.length > 0 && (
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonTitle}>Comparison</Text>

                <View style={styles.comparisonTable}>
                  <View style={styles.comparisonHeader}>
                    <Text style={[styles.comparisonHeaderCell, { flex: 2 }]}>
                      Criteria
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonHeaderCell, { flex: 1 }]}>
                        {item.name}
                      </Text>
                    ))}
                  </View>

                  {/* Monthly Income Row */}
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonCell, { flex: 2 }]}>
                      Monthly Income
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonCell, { flex: 1 }]}>
                        {item.monthlyIncome
                          ? `$${item.monthlyIncome}`
                          : '-'}
                      </Text>
                    ))}
                  </View>

                  {/* Lump Sum Row */}
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonCell, { flex: 2 }]}>
                      Lump Sum Investment
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonCell, { flex: 1 }]}>
                        {item.lumpSum
                          ? `$${item.lumpSum.toLocaleString()}`
                          : '-'}
                      </Text>
                    ))}
                  </View>

                  {/* Processing Time Row */}
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonCell, { flex: 2 }]}>
                      Processing Time
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonCell, { flex: 1 }]}>
                        {item.processingTime}
                      </Text>
                    ))}
                  </View>

                  {/* Cost Row */}
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonCell, { flex: 2 }]}>
                      Processing Cost
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonCell, { flex: 1 }]}>
                        ${item.cost}
                      </Text>
                    ))}
                  </View>

                  {/* Work Authorization Row */}
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonCell, { flex: 2 }]}>
                      Work Authorization
                    </Text>
                    {getComparisonData().map((item) => (
                      <Text key={item.id} style={[styles.comparisonCell, { flex: 1 }]}>
                        {item.id === 'investor' || item.id === 'rentista'
                          ? 'Yes'
                          : 'Limited'}
                      </Text>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSelectedForComparison([])}
                >
                  <Text style={styles.clearButtonText}>Clear Selection</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Information</Text>
          <Text style={styles.infoText}>
            • All amounts are current as of 2024 and subject to change
          </Text>
          <Text style={styles.infoText}>
            • Visa types can be combined (e.g., Pensionado + property investment)
          </Text>
          <Text style={styles.infoText}>
            • Spouse and dependent children can apply together
          </Text>
          <Text style={styles.infoText}>
            • After 3 years on any temporary visa, can apply for permanent residency
          </Text>
          <Text style={styles.infoText}>
            • Contact DGME (Dirección General de Migración) for official information
          </Text>
        </View>
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  categoryRequirement: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  detailsSection: {
    marginTop: 24,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  tipsCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 20,
    marginBottom: 8,
  },
  comparisonSection: {
    marginTop: 24,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  comparisonTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  comparisonHeaderCell: {
    padding: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  comparisonCell: {
    padding: 12,
    fontSize: 12,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default ResidencyGuide;
