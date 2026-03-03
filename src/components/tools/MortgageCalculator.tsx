import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import FinancialCalculations from '../utils/calculations';
import Validator from '../utils/validation';
import CurrencyConverter from '../utils/currency';
import { useAppStore } from '../store/store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface MortgageState {
  loanAmount: string;
  downPayment: string;
  propertyPrice: string;
  interestRate: string;
  loanTermYears: string;
  currency: string;
  country: 'CR' | 'US' | 'CA' | 'MX';
}

interface AmortizationItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const BANK_RATES: Record<string, Record<string, number>> = {
  CR: {
    '5-year': 6.5,
    '10-year': 7.0,
    '15-year': 7.25,
    '20-year': 7.5,
    '25-year': 7.75,
    '30-year': 8.0,
  },
  US: {
    '5-year': 4.5,
    '10-year': 4.75,
    '15-year': 4.25,
    '20-year': 4.5,
    '25-year': 4.75,
    '30-year': 5.0,
  },
  CA: {
    '5-year': 3.5,
    '10-year': 4.0,
    '15-year': 4.25,
    '20-year': 4.5,
    '25-year': 4.75,
    '30-year': 5.0,
  },
  MX: {
    '5-year': 5.0,
    '10-year': 5.5,
    '15-year': 6.0,
    '20-year': 6.5,
    '25-year': 7.0,
    '30-year': 7.5,
  },
};

const MortgageCalculator: React.FC = () => {
  const [state, setState] = useState<MortgageState>({
    loanAmount: '',
    downPayment: '',
    propertyPrice: '',
    interestRate: '',
    loanTermYears: '25',
    currency: 'USD',
    country: 'CR',
  });

  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationItem[]>([]);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const { addCalculation, currency: storeCurrency } = useAppStore();

  const handleInputChange = (field: keyof MortgageState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const calculateFromPrice = () => {
    const price = parseFloat(state.propertyPrice);
    const down = parseFloat(state.downPayment);

    if (!isNaN(price) && !isNaN(down)) {
      const loan = price - down;
      setState((prev) => ({
        ...prev,
        loanAmount: loan.toFixed(0),
      }));
    }
  };

  const calculateFromLoan = () => {
    const loan = parseFloat(state.loanAmount);
    const price = parseFloat(state.propertyPrice);

    if (!isNaN(loan) && !isNaN(price)) {
      const down = price - loan;
      setState((prev) => ({
        ...prev,
        downPayment: Math.max(0, down).toFixed(0),
      }));
    }
  };

  const autoFillRate = () => {
    const term = `${state.loanTermYears}-year`;
    const rates = BANK_RATES[state.country];
    if (rates[term]) {
      setState((prev) => ({
        ...prev,
        interestRate: rates[term].toString(),
      }));
    }
  };

  const calculateMortgage = async () => {
    const validationErrors: string[] = [];

    // Validate inputs
    const loanError = Validator.isPositiveNumber(state.loanAmount, 'Loan Amount');
    if (loanError) validationErrors.push(loanError.message);

    const rateError = Validator.isValidPercentage(state.interestRate, 'Interest Rate');
    if (rateError) validationErrors.push(rateError.message);

    const termError = Validator.isPositiveNumber(state.loanTermYears, 'Loan Term');
    if (termError) validationErrors.push(termError.message);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const loanAmount = parseFloat(state.loanAmount);
      const interestRate = parseFloat(state.interestRate);
      const loanTermYears = parseInt(state.loanTermYears);
      const loanTermMonths = loanTermYears * 12;

      // Calculate monthly payment
      const payment = FinancialCalculations.calculateMonthlyPayment(
        loanAmount,
        interestRate,
        loanTermMonths
      );

      // Generate amortization schedule
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        loanAmount,
        interestRate,
        loanTermMonths
      );

      const totalPaid = payment * loanTermMonths;
      const interest = totalPaid - loanAmount;

      setMonthlyPayment(payment);
      setTotalInterest(interest);
      setTotalPayment(totalPaid);
      setAmortizationSchedule(schedule);

      // Save calculation
      await addCalculation({
        type: 'mortgage',
        name: `Mortgage Calc - ${new Date().toLocaleDateString()}`,
        data: {
          inputs: state,
          results: {
            monthlyPayment: payment,
            totalInterest: interest,
            totalPayment: totalPaid,
            loanTermMonths,
          },
        },
      });
    } catch (error) {
      Alert.alert('Calculation Error', 'An error occurred during calculation');
      console.error('Mortgage calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSchedule = async () => {
    if (!amortizationSchedule.length) {
      Alert.alert('Export', 'Please calculate the mortgage first');
      return;
    }

    try {
      const csvContent = generateAmortizationCSV();
      const fileName = `Mortgage_Schedule_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Success', `Schedule saved to ${filePath}`);
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export schedule');
      console.error('Export error:', error);
    }
  };

  const generateAmortizationCSV = (): string => {
    const lines = [
      'AMORTIZATION SCHEDULE',
      `Generated: ${new Date().toLocaleString()}`,
      `Loan Amount: ${CurrencyConverter.format(parseFloat(state.loanAmount), state.currency)}`,
      `Interest Rate: ${state.interestRate}%`,
      `Loan Term: ${state.loanTermYears} years`,
      `Monthly Payment: ${CurrencyConverter.format(monthlyPayment || 0, state.currency)}`,
      '',
      'Month,Payment,Principal,Interest,Balance',
      ...amortizationSchedule.slice(0, 360).map((item) =>
        `${item.month},${item.payment.toFixed(2)},${item.principal.toFixed(2)},${item.interest.toFixed(2)},${item.balance.toFixed(2)}`
      ),
    ];

    return lines.join('\n');
  };

  const renderScheduleItem = ({ item }: { item: AmortizationItem }) => (
    <View style={styles.scheduleRow}>
      <Text style={[styles.scheduleCell, { flex: 1 }]}>
        {item.month}
      </Text>
      <Text style={[styles.scheduleCell, { flex: 2 }]}>
        ${item.payment.toFixed(0)}
      </Text>
      <Text style={[styles.scheduleCell, { flex: 2 }]}>
        ${item.principal.toFixed(0)}
      </Text>
      <Text style={[styles.scheduleCell, { flex: 2 }]}>
        ${item.interest.toFixed(0)}
      </Text>
      <Text style={[styles.scheduleCell, { flex: 2, color: '#007AFF' }]}>
        ${item.balance.toFixed(0)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Mortgage Calculator</Text>

        <View style={styles.countryContainer}>
          <Text style={styles.label}>Country</Text>
          <Picker
            selectedValue={state.country}
            onValueChange={(value) => handleInputChange('country', value as any)}
            style={styles.picker}
          >
            <Picker.Item label="Costa Rica" value="CR" />
            <Picker.Item label="United States" value="US" />
            <Picker.Item label="Canada" value="CA" />
            <Picker.Item label="Mexico" value="MX" />
          </Picker>
        </View>

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

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Property Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              keyboardType="decimal-pad"
              value={state.propertyPrice}
              onChangeText={(value) => handleInputChange('propertyPrice', value)}
              onBlur={calculateFromPrice}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Down Payment</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={state.downPayment}
              onChangeText={(value) => handleInputChange('downPayment', value)}
              onBlur={calculateFromLoan}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Loan Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Calculated"
              keyboardType="decimal-pad"
              value={state.loanAmount}
              onChangeText={(value) => handleInputChange('loanAmount', value)}
              onBlur={calculateFromPrice}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Loan Term (Years)</Text>
            <Picker
              selectedValue={state.loanTermYears}
              onValueChange={(value) => handleInputChange('loanTermYears', value)}
              style={styles.picker}
            >
              <Picker.Item label="5" value="5" />
              <Picker.Item label="10" value="10" />
              <Picker.Item label="15" value="15" />
              <Picker.Item label="20" value="20" />
              <Picker.Item label="25" value="25" />
              <Picker.Item label="30" value="30" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter rate"
              keyboardType="decimal-pad"
              value={state.interestRate}
              onChangeText={(value) => handleInputChange('interestRate', value)}
            />
          </View>
          <View style={[styles.buttonGroup, { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.smallButton, { marginTop: 28 }]}
              onPress={autoFillRate}
            >
              <Text style={styles.smallButtonText}>Auto-Fill</Text>
            </TouchableOpacity>
          </View>
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
          onPress={calculateMortgage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Calculate Mortgage</Text>
          )}
        </TouchableOpacity>
      </View>

      {monthlyPayment !== null && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Summary</Text>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Monthly Payment</Text>
            <Text style={styles.resultValue}>
              {CurrencyConverter.format(monthlyPayment, state.currency)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Total Interest</Text>
            <Text style={styles.resultValue}>
              {CurrencyConverter.format(totalInterest || 0, state.currency)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Total Payment</Text>
            <Text style={styles.resultValue}>
              {CurrencyConverter.format(totalPayment || 0, state.currency)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Loan Term</Text>
            <Text style={styles.resultValue}>
              {state.loanTermYears} years ({parseInt(state.loanTermYears) * 12} months)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setShowSchedule(!showSchedule)}
          >
            <Text style={styles.buttonText}>
              {showSchedule ? 'Hide' : 'Show'} Amortization Schedule
            </Text>
          </TouchableOpacity>

          {showSchedule && (
            <View style={styles.scheduleContainer}>
              <View style={styles.scheduleHeader}>
                <Text style={[styles.scheduleCell, { flex: 1, fontWeight: '700' }]}>
                  Month
                </Text>
                <Text style={[styles.scheduleCell, { flex: 2, fontWeight: '700' }]}>
                  Payment
                </Text>
                <Text style={[styles.scheduleCell, { flex: 2, fontWeight: '700' }]}>
                  Principal
                </Text>
                <Text style={[styles.scheduleCell, { flex: 2, fontWeight: '700' }]}>
                  Interest
                </Text>
                <Text style={[styles.scheduleCell, { flex: 2, fontWeight: '700' }]}>
                  Balance
                </Text>
              </View>

              <FlatList
                scrollEnabled={true}
                nestedScrollEnabled={true}
                data={amortizationSchedule}
                renderItem={renderScheduleItem}
                keyExtractor={(item) => item.month.toString()}
                maxToRenderPerBatch={20}
              />
            </View>
          )}

          <TouchableOpacity style={styles.exportButton} onPress={exportSchedule}>
            <Text style={styles.buttonText}>Export Schedule</Text>
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
  countryContainer: {
    marginBottom: 16,
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    justifyContent: 'flex-end',
  },
  smallButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  scheduleButton: {
    backgroundColor: '#5856D6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  scheduleContainer: {
    marginTop: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 400,
  },
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleCell: {
    fontSize: 11,
    color: '#666',
  },
  exportButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default MortgageCalculator;
