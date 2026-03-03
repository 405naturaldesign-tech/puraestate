import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Decimal from 'decimal.js';
import FinancialCalculations from '../utils/calculations';
import Validator, { ValidationError } from '../utils/validation';
import CurrencyConverter from '../utils/currency';
import { useAppStore } from '../store/store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ROIState {
  propertyPrice: string;
  downPayment: string;
  monthlyRent: string;
  annualExpenses: string;
  occupancyRate: string;
  monthlyMortgage: string;
  currency: string;
  projectionYears: string;
}

interface ROIResults {
  capRate: number;
  cashOnCash: number;
  annualCashFlow: number;
  roi: number;
  buyToRentRatio: number;
  dscr: number;
  rentalProjections: number[];
}

const ROICalculator: React.FC = () => {
  const [state, setState] = useState<ROIState>({
    propertyPrice: '',
    downPayment: '',
    monthlyRent: '',
    annualExpenses: '',
    occupancyRate: '90',
    monthlyMortgage: '',
    currency: 'USD',
    projectionYears: '5',
  });

  const [results, setResults] = useState<ROIResults | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const { addCalculation, currency: storeCurrency } = useAppStore();

  useEffect(() => {
    setState((prev) => ({ ...prev, currency: storeCurrency }));
  }, [storeCurrency]);

  const handleInputChange = (field: keyof ROIState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const validateInputs = (): boolean => {
    const validationErrors: ValidationError[] = [];

    const priceError = Validator.isPositiveNumber(state.propertyPrice, 'Property Price');
    if (priceError) validationErrors.push(priceError);

    const downPaymentError = Validator.isNonNegativeNumber(state.downPayment, 'Down Payment');
    if (downPaymentError) validationErrors.push(downPaymentError);

    const rentError = Validator.isNonNegativeNumber(state.monthlyRent, 'Monthly Rent');
    if (rentError) validationErrors.push(rentError);

    const expensesError = Validator.isNonNegativeNumber(state.annualExpenses, 'Annual Expenses');
    if (expensesError) validationErrors.push(expensesError);

    const occupancyError = Validator.isValidPercentage(state.occupancyRate, 'Occupancy Rate');
    if (occupancyError) validationErrors.push(occupancyError);

    const yearsError = Validator.isPositiveNumber(state.projectionYears, 'Projection Years');
    if (yearsError) validationErrors.push(yearsError);

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const calculateROI = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const propertyPrice = parseFloat(state.propertyPrice);
      const downPayment = parseFloat(state.downPayment);
      const monthlyRent = parseFloat(state.monthlyRent);
      const annualExpenses = parseFloat(state.annualExpenses);
      const occupancyRate = parseFloat(state.occupancyRate);
      const monthlyMortgage = parseFloat(state.monthlyMortgage || '0');
      const projectionYears = parseInt(state.projectionYears);

      // Calculate NOI
      const noi = FinancialCalculations.calculateNOI(
        monthlyRent,
        occupancyRate,
        annualExpenses
      );

      // Calculate annual cash flow
      const annualRent = monthlyRent * 12 * (occupancyRate / 100);
      const annualCashFlow = annualRent - annualExpenses - monthlyMortgage * 12;

      // Calculate Cap Rate
      const capRate = FinancialCalculations.calculateCapRate(noi, propertyPrice);

      // Calculate Cash-on-Cash
      const cashOnCash = FinancialCalculations.calculateCashOnCash(
        annualCashFlow,
        downPayment
      );

      // Calculate Buy-to-Rent Ratio
      const buyToRentRatio = FinancialCalculations.calculateBuyToRentRatio(
        propertyPrice,
        monthlyRent
      );

      // Calculate DSCR
      const dscr = FinancialCalculations.calculateDSCR(noi, monthlyMortgage);

      // Project rental income
      const rentalProjections = FinancialCalculations.projectRentalIncome(
        monthlyRent,
        3, // 3% annual growth
        projectionYears
      );

      const calculatedResults: ROIResults = {
        capRate,
        cashOnCash,
        annualCashFlow,
        roi: FinancialCalculations.calculateROI(annualCashFlow, downPayment),
        buyToRentRatio,
        dscr,
        rentalProjections,
      };

      setResults(calculatedResults);

      // Save calculation
      await addCalculation({
        type: 'roi',
        name: `ROI Calc - ${new Date().toLocaleDateString()}`,
        data: {
          inputs: state,
          results: calculatedResults,
        },
      });
    } catch (error) {
      Alert.alert('Calculation Error', 'An error occurred during calculation');
      console.error('ROI Calculation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!results) {
      Alert.alert('Export', 'Please calculate ROI first');
      return;
    }

    try {
      const csvContent = generateCSV();
      const fileName = `ROI_Report_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Success', `Report saved to ${filePath}`);
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export report');
      console.error('Export error:', error);
    }
  };

  const generateCSV = (): string => {
    if (!results) return '';

    const lines = [
      'ROI Investment Calculator Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'INPUTS',
      `Property Price: ${CurrencyConverter.format(parseFloat(state.propertyPrice), state.currency)}`,
      `Down Payment: ${CurrencyConverter.format(parseFloat(state.downPayment), state.currency)}`,
      `Monthly Rent: ${CurrencyConverter.format(parseFloat(state.monthlyRent), state.currency)}`,
      `Annual Expenses: ${CurrencyConverter.format(parseFloat(state.annualExpenses), state.currency)}`,
      `Occupancy Rate: ${state.occupancyRate}%`,
      `Monthly Mortgage: ${CurrencyConverter.format(parseFloat(state.monthlyMortgage || '0'), state.currency)}`,
      '',
      'RESULTS',
      `Cap Rate: ${results.capRate.toFixed(2)}%`,
      `Cash-on-Cash Return: ${results.cashOnCash.toFixed(2)}%`,
      `Annual Cash Flow: ${CurrencyConverter.format(results.annualCashFlow, state.currency)}`,
      `ROI: ${results.roi.toFixed(2)}%`,
      `Buy-to-Rent Ratio: ${results.buyToRentRatio.toFixed(2)}`,
      `Debt Service Coverage Ratio: ${results.dscr.toFixed(2)}`,
      '',
      'RENTAL PROJECTIONS',
      ...results.rentalProjections.map((rent, index) =>
        `Year ${index + 1}: ${CurrencyConverter.format(rent * 12, state.currency)}`
      ),
    ];

    return lines.join('\n');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>ROI Investment Calculator</Text>

        <View style={styles.currencyContainer}>
          <Text style={styles.label}>Currency</Text>
          <Picker
            selectedValue={state.currency}
            onValueChange={(value) => handleInputChange('currency', value)}
            style={styles.picker}
          >
            <Picker.Item label="USD" value="USD" />
            <Picker.Item label="CRC" value="CRC" />
            <Picker.Item label="EUR" value="EUR" />
            <Picker.Item label="CAD" value="CAD" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Property Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter property price"
            keyboardType="decimal-pad"
            value={state.propertyPrice}
            onChangeText={(value) => handleInputChange('propertyPrice', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Down Payment</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter down payment"
            keyboardType="decimal-pad"
            value={state.downPayment}
            onChangeText={(value) => handleInputChange('downPayment', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Rent</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter monthly rent"
            keyboardType="decimal-pad"
            value={state.monthlyRent}
            onChangeText={(value) => handleInputChange('monthlyRent', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Annual Expenses</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter annual expenses"
            keyboardType="decimal-pad"
            value={state.annualExpenses}
            onChangeText={(value) => handleInputChange('annualExpenses', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Occupancy Rate (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="90"
            keyboardType="decimal-pad"
            value={state.occupancyRate}
            onChangeText={(value) => handleInputChange('occupancyRate', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Mortgage Payment</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter monthly mortgage (optional)"
            keyboardType="decimal-pad"
            value={state.monthlyMortgage}
            onChangeText={(value) => handleInputChange('monthlyMortgage', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Projection Years</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            keyboardType="number-pad"
            value={state.projectionYears}
            onChangeText={(value) => handleInputChange('projectionYears', value)}
          />
        </View>

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error.message}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={calculateROI}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Calculate ROI</Text>
          )}
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Results</Text>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Cap Rate</Text>
            <Text style={styles.resultValue}>{results.capRate.toFixed(2)}%</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Cash-on-Cash Return</Text>
            <Text style={styles.resultValue}>{results.cashOnCash.toFixed(2)}%</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Annual Cash Flow</Text>
            <Text style={styles.resultValue}>
              {CurrencyConverter.format(results.annualCashFlow, state.currency)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>ROI</Text>
            <Text style={styles.resultValue}>{results.roi.toFixed(2)}%</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Buy-to-Rent Ratio</Text>
            <Text style={styles.resultValue}>{results.buyToRentRatio.toFixed(2)}</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>DSCR</Text>
            <Text style={[styles.resultValue, results.dscr > 1.25 && styles.positive]}>
              {results.dscr.toFixed(2)} {results.dscr > 1.25 && '✓'}
            </Text>
          </View>

          <View style={styles.projectionsContainer}>
            <Text style={styles.projectionsTitle}>5-Year Rental Projections</Text>
            {results.rentalProjections.map((rent, index) => (
              <View key={index} style={styles.projectionItem}>
                <Text style={styles.projectionLabel}>Year {index + 1}</Text>
                <Text style={styles.projectionValue}>
                  {CurrencyConverter.format(rent * 12, state.currency)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
            <Text style={styles.buttonText}>Export Report</Text>
          </TouchableOpacity>
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
  currencyContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  positive: {
    color: '#34C759',
  },
  projectionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  projectionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  projectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  projectionLabel: {
    fontSize: 13,
    color: '#666',
  },
  projectionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ROICalculator;
