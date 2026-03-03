import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useAppStore, Tenant, Transaction } from '../store/store';
import { Picker } from '@react-native-picker/picker';
import CurrencyConverter from '../utils/currency';
import Validator from '../utils/validation';

interface PropertyManagerProps {
  propertyId?: string;
}

const PropertyManager: React.FC<PropertyManagerProps> = ({ propertyId }) => {
  const {
    properties,
    tenants,
    transactions,
    addTenant,
    updateTenant,
    deleteTenant,
    addTransaction,
    getTenantsByProperty,
    getTransactions,
  } = useAppStore();

  const [selectedProperty, setSelectedProperty] = useState<string>(propertyId || '');
  const [activeTab, setActiveTab] = useState<'tenants' | 'payments' | 'maintenance'>('tenants');
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

  // Tenant form state
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    rentAmount: '',
    leaseEndDate: '',
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'rent' as 'rent' | 'expense' | 'maintenance' | 'payment',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    currency: 'USD',
  });

  const currentTenants = selectedProperty ? getTenantsByProperty(selectedProperty) : [];
  const currentTransactions = selectedProperty ? getTransactions(selectedProperty) : [];

  const propertyList = properties.map((prop) => ({
    label: prop.name,
    value: prop.id,
  }));

  const handleAddTenant = async () => {
    if (!selectedProperty) {
      Alert.alert('Error', 'Please select a property first');
      return;
    }

    // Validate inputs
    const errors = [];
    if (!tenantForm.name.trim()) errors.push('Name is required');
    if (tenantForm.email && !Validator.isValidEmail(tenantForm.email)) {
      errors.push('Invalid email format');
    }
    if (tenantForm.phone && !Validator.isValidPhoneNumber(tenantForm.phone)) {
      errors.push('Invalid phone number');
    }

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      await addTenant({
        propertyId: selectedProperty,
        name: tenantForm.name,
        email: tenantForm.email,
        phone: tenantForm.phone,
        data: {
          moveInDate: tenantForm.moveInDate,
          rentAmount: parseFloat(tenantForm.rentAmount || '0'),
          leaseEndDate: tenantForm.leaseEndDate,
        },
      });

      setTenantForm({
        name: '',
        email: '',
        phone: '',
        moveInDate: '',
        rentAmount: '',
        leaseEndDate: '',
      });
      setShowAddTenantModal(false);
      Alert.alert('Success', 'Tenant added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add tenant');
      console.error('Error adding tenant:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedProperty) {
      Alert.alert('Error', 'Please select a property first');
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addTransaction({
        propertyId: selectedProperty,
        type: transactionForm.type,
        amount,
        currency: transactionForm.currency,
        date: new Date(transactionForm.date).getTime(),
        description: transactionForm.description,
      });

      setTransactionForm({
        type: 'rent',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        currency: 'USD',
      });
      setShowAddTransactionModal(false);
      Alert.alert('Success', 'Transaction recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record transaction');
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTenant = (tenantId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this tenant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTenant(tenantId);
            Alert.alert('Success', 'Tenant removed');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete tenant');
          }
        },
      },
    ]);
  };

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.itemSubtitle}>{item.email}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteTenant(item.id)}>
          <Text style={styles.deleteButton}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>Phone: {item.phone || 'N/A'}</Text>
        <Text style={styles.detailText}>
          Rent: {CurrencyConverter.format(item.data.rentAmount || 0, 'USD')}
        </Text>
        {item.data.leaseEndDate && (
          <Text style={styles.detailText}>Lease Ends: {item.data.leaseEndDate}</Text>
        )}
      </View>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTitle}>{item.type.toUpperCase()}</Text>
          <Text style={styles.itemSubtitle}>{item.description}</Text>
        </View>
        <Text style={[styles.amount, item.type === 'rent' && styles.income]}>
          {CurrencyConverter.format(item.amount, item.currency)}
        </Text>
      </View>
      <Text style={styles.dateText}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.propertySelector}>
        <Text style={styles.label}>Select Property</Text>
        <Picker
          selectedValue={selectedProperty}
          onValueChange={setSelectedProperty}
          style={styles.picker}
        >
          <Picker.Item label="Choose a property..." value="" />
          {propertyList.map((prop) => (
            <Picker.Item key={prop.value} label={prop.label} value={prop.value} />
          ))}
        </Picker>
      </View>

      {selectedProperty && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tenants' && styles.activeTab]}
            onPress={() => setActiveTab('tenants')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'tenants' && styles.activeTabText,
              ]}
            >
              Tenants ({currentTenants.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'payments' && styles.activeTabText,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'maintenance' && styles.activeTab]}
            onPress={() => setActiveTab('maintenance')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'maintenance' && styles.activeTabText,
              ]}
            >
              Maintenance
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {activeTab === 'tenants' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddTenantModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Tenant</Text>
            </TouchableOpacity>

            {currentTenants.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={currentTenants}
                renderItem={renderTenantItem}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <Text style={styles.emptyText}>No tenants yet</Text>
            )}
          </View>
        )}

        {(activeTab === 'payments' || activeTab === 'maintenance') && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddTransactionModal(true)}
            >
              <Text style={styles.addButtonText}>
                + Add {activeTab === 'payments' ? 'Payment' : 'Maintenance'}
              </Text>
            </TouchableOpacity>

            {currentTransactions.filter((t) =>
              activeTab === 'payments'
                ? ['rent', 'payment'].includes(t.type)
                : t.type === 'maintenance'
            ).length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={currentTransactions.filter((t) =>
                  activeTab === 'payments'
                    ? ['rent', 'payment'].includes(t.type)
                    : t.type === 'maintenance'
                )}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <Text style={styles.emptyText}>No records yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Tenant Modal */}
      <Modal
        visible={showAddTenantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTenantModal(false)}
      >
        <View style={styles.modal}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tenant</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tenant name"
                value={tenantForm.name}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, name: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                value={tenantForm.email}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, email: value }))
                }
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={tenantForm.phone}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, phone: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Move-in Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={tenantForm.moveInDate}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, moveInDate: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Rent</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter monthly rent"
                keyboardType="decimal-pad"
                value={tenantForm.rentAmount}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, rentAmount: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lease End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={tenantForm.leaseEndDate}
                onChangeText={(value) =>
                  setTenantForm((prev) => ({ ...prev, leaseEndDate: value }))
                }
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddTenant}
            >
              <Text style={styles.buttonText}>Add Tenant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddTenantModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddTransactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTransactionModal(false)}
      >
        <View style={styles.modal}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {activeTab === 'payments' ? 'Payment' : 'Maintenance Record'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <Picker
                selectedValue={transactionForm.type}
                onValueChange={(value) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    type: value as Transaction['type'],
                  }))
                }
                style={styles.picker}
              >
                <Picker.Item label="Rent Received" value="rent" />
                <Picker.Item label="Payment" value="payment" />
                <Picker.Item label="Maintenance" value="maintenance" />
                <Picker.Item label="Expense" value="expense" />
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                value={transactionForm.amount}
                onChangeText={(value) =>
                  setTransactionForm((prev) => ({ ...prev, amount: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Currency</Text>
              <Picker
                selectedValue={transactionForm.currency}
                onValueChange={(value) =>
                  setTransactionForm((prev) => ({ ...prev, currency: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="USD" value="USD" />
                <Picker.Item label="CRC" value="CRC" />
                <Picker.Item label="EUR" value="EUR" />
                <Picker.Item label="CAD" value="CAD" />
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={transactionForm.date}
                onChangeText={(value) =>
                  setTransactionForm((prev) => ({ ...prev, date: value }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                value={transactionForm.description}
                onChangeText={(value) =>
                  setTransactionForm((prev) => ({ ...prev, description: value }))
                }
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddTransaction}
            >
              <Text style={styles.buttonText}>Add Record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddTransactionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  propertySelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  itemDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    fontSize: 28,
    color: '#ff3b30',
    fontWeight: '300',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff3b30',
  },
  income: {
    color: '#34C759',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 32,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyManager;
