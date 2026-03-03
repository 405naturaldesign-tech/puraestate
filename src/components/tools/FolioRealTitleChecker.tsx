import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import axios from 'axios';
import { useAppStore } from '../store/store';

interface TitleCheckResult {
  folioNumber: string;
  propertyAddress: string;
  owner: string;
  ownerType: 'individual' | 'corporation' | 'government';
  registrationDate: string;
  status: 'active' | 'disputed' | 'encumbered' | 'pending';
  areaM2: number;
  canton: string;
  district: string;
  township: string;
  liens: Array<{
    id: string;
    type: string;
    amount?: number;
    holder: string;
    date: string;
  }>;
  history: Array<{
    date: string;
    transaction: string;
    owner: string;
    amount?: number;
  }>;
  redFlags: string[];
  lastUpdated: string;
}

const FolioRealTitleChecker: React.FC = () => {
  const [folioNumber, setFolioNumber] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [searchType, setSearchType] = useState<'folio' | 'address'>('folio');
  const [result, setResult] = useState<TitleCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { addCalculation } = useAppStore();

  // Mock data for demonstration (in production, connect to National Registry API)
  const mockResults: Record<string, TitleCheckResult> = {
    '00001234567800': {
      folioNumber: '00001234567800',
      propertyAddress: '100 Calle Central, San José, Costa Rica',
      owner: 'John Smith',
      ownerType: 'individual',
      registrationDate: '2020-05-15',
      status: 'active',
      areaM2: 350,
      canton: 'San José',
      district: 'San José',
      township: 'San José',
      liens: [],
      history: [
        {
          date: '2020-05-15',
          transaction: 'Original Registration',
          owner: 'John Smith',
          amount: 450000,
        },
        {
          date: '2021-03-20',
          transaction: 'Mortgage',
          owner: 'BCAC',
          amount: 300000,
        },
      ],
      redFlags: [],
      lastUpdated: new Date().toISOString(),
    },
    '00001234567801': {
      folioNumber: '00001234567801',
      propertyAddress: '200 Avenida Central, San Pedro, Costa Rica',
      owner: 'Maria Garcia',
      ownerType: 'individual',
      registrationDate: '2015-08-10',
      status: 'disputed',
      areaM2: 500,
      canton: 'San José',
      district: 'San Pedro',
      township: 'San Pedro',
      liens: [
        {
          id: 'L001',
          type: 'Mortgage',
          amount: 350000,
          holder: 'Banco Nacional',
          date: '2020-01-15',
        },
        {
          id: 'L002',
          type: 'Tax Lien',
          holder: 'Ministry of Finance',
          date: '2023-06-01',
        },
      ],
      history: [
        {
          date: '2015-08-10',
          transaction: 'Original Registration',
          owner: 'Maria Garcia',
          amount: 600000,
        },
      ],
      redFlags: [
        'Property has a tax lien',
        'Disputed ownership claim detected',
        'Multiple liens recorded',
      ],
      lastUpdated: new Date().toISOString(),
    },
  };

  const searchTitle = async () => {
    const validationErrors: string[] = [];

    if (searchType === 'folio' && !folioNumber.trim()) {
      validationErrors.push('Please enter a Folio number');
    }
    if (searchType === 'address' && !propertyAddress.trim()) {
      validationErrors.push('Please enter a property address');
    }

    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setLoading(true);

    try {
      // Simulate API call
      let mockResult = null;

      if (searchType === 'folio') {
        mockResult = mockResults[folioNumber] || mockResults['00001234567800'];
      } else {
        // In production, search by address
        mockResult = propertyAddress.toLowerCase().includes('pedro')
          ? mockResults['00001234567801']
          : mockResults['00001234567800'];
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setResult(mockResult);

      // Save search
      await addCalculation({
        type: 'title_check',
        name: `Title Check - ${mockResult.folioNumber}`,
        data: {
          inputs: { folioNumber, propertyAddress, searchType },
          results: mockResult,
        },
      });
    } catch (error) {
      Alert.alert('Search Error', 'Failed to retrieve title information');
      console.error('Title search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'disputed':
        return '#FF9500';
      case 'encumbered':
        return '#FF3B30';
      case 'pending':
        return '#5856D6';
      default:
        return '#999';
    }
  };

  const getStatusBadgeStyle = (status: string) => [
    styles.statusBadge,
    { backgroundColor: getStatusColor(status) },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Folio Real Title Checker</Text>

        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'folio' && styles.searchTypeButtonActive,
            ]}
            onPress={() => setSearchType('folio')}
          >
            <Text
              style={[
                styles.searchTypeButtonText,
                searchType === 'folio' && styles.searchTypeButtonTextActive,
              ]}
            >
              Folio Number
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'address' && styles.searchTypeButtonActive,
            ]}
            onPress={() => setSearchType('address')}
          >
            <Text
              style={[
                styles.searchTypeButtonText,
                searchType === 'address' && styles.searchTypeButtonTextActive,
              ]}
            >
              Address
            </Text>
          </TouchableOpacity>
        </View>

        {searchType === 'folio' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Folio Number</Text>
            <Text style={styles.hint}>Format: CCPPLLPPPPOOOO</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 00001234567800"
              value={folioNumber}
              onChangeText={setFolioNumber}
              placeholderTextColor="#ccc"
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter property address"
              value={propertyAddress}
              onChangeText={setPropertyAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor="#ccc"
            />
          </View>
        )}

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={searchTitle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Search Title</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This search connects to Costa Rica's National Registry (Registro Nacional). Results
          are updated regularly.
        </Text>
      </View>

      {result && (
        <View style={styles.resultsSection}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.folioLabel}>Folio Number</Text>
              <Text style={styles.folioNumber}>{result.folioNumber}</Text>
            </View>
            <View style={getStatusBadgeStyle(result.status)}>
              <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Property Address</Text>
              <Text style={styles.infoValue}>{result.propertyAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Owner</Text>
              <Text style={styles.infoValue}>{result.owner}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Area</Text>
              <Text style={styles.infoValue}>{result.areaM2} m²</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {result.canton}, {result.district}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration Date</Text>
              <Text style={styles.infoValue}>
                {new Date(result.registrationDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {result.redFlags.length > 0 && (
            <View style={styles.redFlagsContainer}>
              <Text style={styles.redFlagsTitle}>⚠️ Red Flags</Text>
              {result.redFlags.map((flag, index) => (
                <View key={index} style={styles.redFlagItem}>
                  <Text style={styles.redFlagText}>{flag}</Text>
                </View>
              ))}
            </View>
          )}

          {result.liens.length > 0 && (
            <View style={styles.liensContainer}>
              <Text style={styles.liensTitle}>Liens & Encumbrances</Text>
              {result.liens.map((lien, index) => (
                <View key={index} style={styles.lienItem}>
                  <View style={styles.lienHeader}>
                    <Text style={styles.lienType}>{lien.type}</Text>
                    {lien.amount && (
                      <Text style={styles.lienAmount}>${lien.amount.toLocaleString()}</Text>
                    )}
                  </View>
                  <Text style={styles.lienHolder}>Holder: {lien.holder}</Text>
                  <Text style={styles.lienDate}>{new Date(lien.date).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}

          {result.history.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Transaction History</Text>
              <FlatList
                scrollEnabled={false}
                data={result.history}
                renderItem={({ item, index }) => (
                  <View
                    key={index}
                    style={[
                      styles.historyItem,
                      index !== result.history.length - 1 && styles.historyItemBorder,
                    ]}
                  >
                    <View style={styles.historyDot} />
                    <View style={styles.historyContent}>
                      <Text style={styles.historyDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.historyTransaction}>{item.transaction}</Text>
                      <Text style={styles.historyOwner}>{item.owner}</Text>
                      {item.amount && (
                        <Text style={styles.historyAmount}>
                          ${item.amount.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                keyExtractor={(_, index) => index.toString()}
              />
            </View>
          )}

          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdated}>
              Last Updated: {new Date(result.lastUpdated).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  searchTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  searchTypeButtonTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  folioLabel: {
    fontSize: 12,
    color: '#999',
  },
  folioNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  redFlagsContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  redFlagsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 12,
  },
  redFlagItem: {
    paddingVertical: 8,
  },
  redFlagText: {
    fontSize: 13,
    color: '#856404',
  },
  liensContainer: {
    marginBottom: 16,
  },
  liensTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  lienItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  lienHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lienType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lienAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  lienHolder: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lienDate: {
    fontSize: 12,
    color: '#999',
  },
  historyContainer: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginTop: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyTransaction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  historyOwner: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 2,
  },
  lastUpdatedContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

export default FolioRealTitleChecker;
