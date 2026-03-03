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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import FinancialCalculations from '../utils/calculations';
import Validator from '../utils/validation';
import CurrencyConverter from '../utils/currency';
import { useAppStore } from '../store/store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ClosingCostsState {
  propertyPrice: string;
  propertyType: 'residential' | 'commercial' | 'land';
  currency: string;
  additionalCosts: string;
  hasMortgage: boolean;
  loanAmount: string;
  country: string;
}

interface ClosingCostsBreakdown {
  transferTax: number;
  notaryFees: number;
  registryFees: number;
  legalFees: number;
  inspectionFees: number;
  insuranceFees: number;
  totalBasic: number;
  mortgageInsurance?: number;
  appraisalFee?: number;
  originationFee?: number;
  creditReport?: number;
  titleInsurance?: number;
  surveyFee?: number;
  additionalCosts: number;
  totalCosts: number;
  percentageOfPrice: number;
}

const CLOSING_COSTS_BY_COUNTRY = {
  CR: {
    transferTaxRate: 0.015,
    notaryFeeRate: 0.0075,
    registryFeeRate: 0.005,
    legalFeeRate: 0.01,
    inspectionFee: 200,
    insuranceRate: 0.005,
  },
  US: {
    transferTaxRate: 0.01,
    notaryFeeRate: 0.003,
    registryFeeRate: 0.002,
    legalFeeRate: 0.01,
    inspectionFee: 300,
    insuranceRate: 0.006,
    mortgageInsuranceRate: 0.005,
    appraisalFee: 400,
    originationFeeRate: 0.01,
    creditReport: 50,
    surveyFee: 250,
  },
  CA: {
    transferTaxRate: 0.012,
    notaryFeeRate: 0.004,
    registryFeeRate: 0.003,
    legalFeeRate: 0.015,
    inspectionFee: 250,
    insuranceRate: 0.005,
  },
  MX: {
    transferTaxRate: 0.02,
    notaryFeeRate: 0.01,
    registryFeeRate: 0.005,
    legalFeeRate: 0.015,
    inspectionFee: 300,
    insuranceRate: 0.007,
  },
};

const ClosingCostsBreakdown: React.FC = () => {
  const [state, setState] = useState<ClosingCostsState>({
    propertyPrice: '',
    propertyType: 'residential',
    currency: 'USD',
    additionalCosts: '',
    hasMortgage: false,
    loanAmount: '',
    country: 'CR',
  });

  const [breakdown, setBreakdown] = useState<ClosingCostsBreakdown | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { addCalculation } = useAppStore();

  const handleInputChange = (field: keyof ClosingCostsState, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const calculateClosingCosts = async () => {
    const validationErrors: string[] = [];

    const priceError = Validator.isPositiveNumber(state.propertyPrice, 'Property Price');
    if (priceError) validationErrors.push(priceError.message);

    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setLoading(true);

    try {
      const propertyPrice = parseFloat(state.propertyPrice);
      const additionalCosts = parseFloat(state.additionalCosts || '0');
      const loanAmount = parseFloat(state.loanAmount || '0');

      // Calculate base closing costs
      const baseClosing = FinancialCalculations.calculateClosingCosts(
        propertyPrice,
        state.propertyType
      );

      // Get country-specific rates
      const countryRates = CLOSING_COSTS_BY_COUNTRY[state.country as keyof typeof CLOSING_COSTS_BY_COUNTRY] ||
        CLOSING_COSTS_BY_COUNTRY.CR;

      // Calculate mortgage-related costs if applicable
      let mortgageInsurance = 0;
      let appraisalFee = 0;
      let originationFee = 0;
      let creditReport = 0;
      let surveyFee = 0;

      if (state.hasMortgage && loanAmount > 0 && state.country === 'US') {
        mortgageInsurance = loanAmount * (countryRates.mortgageInsuranceRate || 0.005);
        appraisalFee = countryRates.appraisalFee || 400;
        originationFee = loanAmount * (countryRates.originationFeeRate || 0.01);
        creditReport = countryRates.creditReport || 50;
        surveyFee = countryRates.surveyFee || 250;
      }

      const totalCosts =
        baseClosing.total +
        mortgageInsurance +
        appraisalFee +
        originationFee +
        creditReport +
        surveyFee +
        additionalCosts;

      const calculatedBreakdown: ClosingCostsBreakdown = {
        ...baseClosing,
        mortgageInsurance,
        appraisalFee,
        originationFee,
        creditReport,
        titleInsurance: 0,
        surveyFee,
        additionalCosts,
        totalBasic: baseClosing.total,
        totalCosts,
        percentageOfPrice: (totalCosts / propertyPrice) * 100,
      };

      setBreakdown(calculatedBreakdown);

      // Save calculation
      await addCalculation({
        type: 'closing_costs',
        name: `Closing Costs - ${new Date().toLocaleDateString()}`,
        data: {
          inputs: state,
          results: calculatedBreakdown,
        },
      });
    } catch (error) {
      Alert.alert('Calculation Error', 'An error occurred during calculation');
      console.error('Closing costs calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!breakdown) {
      Alert.alert('Export', 'Please calculate closing costs first');
      return;
    }

    try {
      const csvContent = generateReport();
      const fileName = `Closing_Costs_${Date.now()}.csv`;
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

  const generateReport = (): string => {
    if (!breakdown) return '';

    const lines = [
      'CLOSING COSTS BREAKDOWN',
      `Generated: ${new Date().toLocaleString()}`,
      `Property Price: ${CurrencyConverter.format(parseFloat(state.propertyPrice), state.currency)}`,
      `Property Type: ${state.propertyType}`,
      `Country: ${state.country}`,
      '',
      'BASIC CLOSING COSTS',
      `Transfer Tax: ${CurrencyConverter.format(breakdown.transferTax, state.currency)}`,
      `Notary Fees: ${CurrencyConverter.format(breakdown.notaryFees, state.currency)}`,
      `Registry Fees: ${CurrencyConverter.format(breakdown.registryFees, state.currency)}`,
      `Legal Fees: ${CurrencyConverter.format(breakdown.legalFees, state.currency)}`,
      `Inspection Fees: ${CurrencyConverter.format(breakdown.inspectionFees, state.currency)}`,
      `Insurance Fees: ${CurrencyConverter.format(breakdown.insuranceFees, state.currency)}`,
      `Subtotal: ${CurrencyConverter.format(breakdown.totalBasic, state.currency)}`,
      '',
      ...(state.hasMortgage && breakdown.mortgageInsurance
        ? [
            'MORTGAGE-RELATED COSTS',
            `Mortgage Insurance: ${CurrencyConverter.format(breakdown.mortgageInsurance, state.currency)}`,
            `Appraisal Fee: ${CurrencyConverter.format(breakdown.appraisalFee || 0, state.currency)}`,
            `Origination Fee: ${CurrencyConverter.format(breakdown.originationFee || 0, state.currency)}`,
            `Credit Report: ${CurrencyConverter.format(breakdown.creditReport || 0, state.currency)}`,
            `Survey Fee: ${CurrencyConverter.format(breakdown.surveyFee || 0, state.currency)}`,
          ]
        : []),
      '',
      breakdown.additionalCosts > 0
        ? `Additional Costs: ${CurrencyConverter.format(breakdown.additionalCosts, state.currency)}`
        : '',
      '',
      'TOTAL',
      `Total Closing Costs: ${CurrencyConverter.format(breakdown.totalCosts, state.currency)}`,
      `As % of Property Price: ${breakdown.percentageOfPrice.toFixed(2)}%`,
    ];

    return lines.filter((line) => line !== '').join('\n');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Closing Costs Breakdown</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <Picker
            selectedValue={state.country}
            onValueChange={(value) => handleInputChange('country', value)}
            style={styles.picker}
          >
            <Picker.Item label="Costa Rica" value="CR" />
            <Picker.Item label="United States" value="US" />
            <Picker.Item label="Canada" value="CA" />
            <Picker.Item label="Mexico" value="MX" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
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
          <Text style={styles.label}>Property Type</Text>
          <Picker
            selectedValue={state.propertyType}
            onValueChange={(value) => handleInputChange('propertyType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Residential" value="residential" />
            <Picker.Item label="Commercial" value="commercial" />
            <Picker.Item label="Land" value="land" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleInputChange('hasMortgage', !state.hasMortgage)}
          >
            <View style={[styles.checkboxBox, state.hasMortgage && styles.checkboxChecked]}>
              {state.hasMortgage && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Getting a Mortgage</Text>
          </TouchableOpacity>
        </View>

        {state.hasMortgage && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loan Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter loan amount"
              keyboardType="decimal-pad"
              value={state.loanAmount}
              onChangeText={(value) => handleInputChange('loanAmount', value)}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Costs (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter any additional costs"
            keyboardType="decimal-pad"
            value={state.additionalCosts}
            onChangeText={(value) => handleInputChange('additionalCosts', value)}
          />
        </View>

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
          onPress={calculateClosingCosts}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Calculate Closing Costs</Text>
          )}
        </TouchableOpacity>
      </View>

      {breakdown && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Cost Breakdown</Text>

          <View style={styles.costCategory}>
            <Text style={styles.categoryTitle}>Basic Closing Costs</Text>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Transfer Tax</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.transferTax, state.currency)}
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Notary Fees</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.notaryFees, state.currency)}
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Registry Fees</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.registryFees, state.currency)}
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Legal Fees</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.legalFees, state.currency)}
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Inspection Fees</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.inspectionFees, state.currency)}
              </Text>
            </View>

            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Insurance</Text>
              <Text style={styles.costValue}>
                {CurrencyConverter.format(breakdown.insuranceFees, state.currency)}
              </Text>
            </View>

            <View style={[styles.costItem, styles.costItemTotal]}>
              <Text style={styles.costLabel}>Subtotal</Text>
              <Text style={styles.costValueTotal}>
                {CurrencyConverter.format(breakdown.totalBasic, state.currency)}
              </Text>
            </View>
          </View>

          {state.hasMortgage && breakdown.mortgageInsurance > 0 && (
            <View style={styles.costCategory}>
              <Text style={styles.categoryTitle}>Mortgage-Related Costs</Text>

              {breakdown.mortgageInsurance > 0 && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Mortgage Insurance</Text>
                  <Text style={styles.costValue}>
                    {CurrencyConverter.format(breakdown.mortgageInsurance, state.currency)}
                  </Text>
                </View>
              )}

              {breakdown.appraisalFee && breakdown.appraisalFee > 0 && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Appraisal Fee</Text>
                  <Text style={styles.costValue}>
                    {CurrencyConverter.format(breakdown.appraisalFee, state.currency)}
                  </Text>
                </View>
              )}

              {breakdown.originationFee && breakdown.originationFee > 0 && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Origination Fee</Text>
                  <Text style={styles.costValue}>
                    {CurrencyConverter.format(breakdown.originationFee, state.currency)}
                  </Text>
                </View>
              )}

              {breakdown.creditReport && breakdown.creditReport > 0 && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Credit Report</Text>
                  <Text style={styles.costValue}>
                    {CurrencyConverter.format(breakdown.creditReport, state.currency)}
                  </Text>
                </View>
              )}

              {breakdown.surveyFee && breakdown.surveyFee > 0 && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Survey Fee</Text>
                  <Text style={styles.costValue}>
                    {CurrencyConverter.format(breakdown.surveyFee, state.currency)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {breakdown.additionalCosts > 0 && (
            <View style={styles.costCategory}>
              <View style={styles.costItem}>
                <Text style={styles.costLabel}>Additional Costs</Text>
                <Text style={styles.costValue}>
                  {CurrencyConverter.format(breakdown.additionalCosts, state.currency)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.totalSection}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Closing Costs</Text>
              <Text style={styles.totalValue}>
                {CurrencyConverter.format(breakdown.totalCosts, state.currency)}
              </Text>
            </View>
            <View style={styles.percentageItem}>
              <Text style={styles.percentageLabel}>
                {breakdown.percentageOfPrice.toFixed(2)}% of property price
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
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
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
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
  costCategory: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  costItemTotal: {
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  costLabel: {
    fontSize: 13,
    color: '#666',
  },
  costValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  costValueTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  totalSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  percentageItem: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  percentageLabel: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  exportButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
});

export default ClosingCostsBreakdown;
