import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  completed: boolean;
  notes: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresFollowUp: boolean;
}

interface InspectionReport {
  id: string;
  propertyName: string;
  inspectionDate: string;
  inspector: string;
  items: ChecklistItem[];
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  redFlags: string[];
  recommendations: string[];
  estimatedRepairs: number;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Structure & Foundation
  {
    id: '1',
    category: 'Foundation & Structure',
    item: 'Foundation cracks or settling',
    completed: false,
    notes: '',
    riskLevel: 'critical',
    requiresFollowUp: false,
  },
  {
    id: '2',
    category: 'Foundation & Structure',
    item: 'Roof condition and leaks',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '3',
    category: 'Foundation & Structure',
    item: 'Wall cracks or water damage',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '4',
    category: 'Foundation & Structure',
    item: 'Termite or pest damage',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },

  // Electrical
  {
    id: '5',
    category: 'Electrical',
    item: 'Electrical panel functionality',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '6',
    category: 'Electrical',
    item: 'Outlets and switches functionality',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
  {
    id: '7',
    category: 'Electrical',
    item: 'Grounding and safety devices',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },

  // Plumbing
  {
    id: '8',
    category: 'Plumbing',
    item: 'Water pressure and quality',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
  {
    id: '9',
    category: 'Plumbing',
    item: 'Pipe condition and corrosion',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '10',
    category: 'Plumbing',
    item: 'Sewage and drainage system',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '11',
    category: 'Plumbing',
    item: 'Water tank condition',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },

  // HVAC & Utilities
  {
    id: '12',
    category: 'HVAC & Utilities',
    item: 'Air conditioning system',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
  {
    id: '13',
    category: 'HVAC & Utilities',
    item: 'Heating system',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },
  {
    id: '14',
    category: 'HVAC & Utilities',
    item: 'Water heater',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },

  // Windows & Doors
  {
    id: '15',
    category: 'Windows & Doors',
    item: 'Door locks and functionality',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },
  {
    id: '16',
    category: 'Windows & Doors',
    item: 'Window seals and weatherproofing',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
  {
    id: '17',
    category: 'Windows & Doors',
    item: 'Glass condition',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },

  // Interior
  {
    id: '18',
    category: 'Interior',
    item: 'Floor condition',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },
  {
    id: '19',
    category: 'Interior',
    item: 'Paint and wall condition',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },
  {
    id: '20',
    category: 'Interior',
    item: 'Ceiling condition',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },

  // Exterior
  {
    id: '21',
    category: 'Exterior',
    item: 'Landscaping and drainage',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
  {
    id: '22',
    category: 'Exterior',
    item: 'Driveway and parking',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },
  {
    id: '23',
    category: 'Exterior',
    item: 'Fence and gates',
    completed: false,
    notes: '',
    riskLevel: 'low',
    requiresFollowUp: false,
  },

  // Safety & Security
  {
    id: '24',
    category: 'Safety & Security',
    item: 'Fire safety equipment',
    completed: false,
    notes: '',
    riskLevel: 'high',
    requiresFollowUp: false,
  },
  {
    id: '25',
    category: 'Safety & Security',
    item: 'Security system functionality',
    completed: false,
    notes: '',
    riskLevel: 'medium',
    requiresFollowUp: false,
  },
];

const InspectionChecklist: React.FC = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [propertyName, setPropertyName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { addCalculation } = useAppStore();

  const categories = Array.from(new Set(checklist.map((item) => item.category)));

  const toggleItem = (id: string) => {
    setChecklist((prevChecklist) =>
      prevChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const openNoteModal = (item: ChecklistItem) => {
    setSelectedItem(item);
    setNoteText(item.notes);
    setShowNoteModal(true);
  };

  const saveNote = () => {
    if (selectedItem) {
      setChecklist((prevChecklist) =>
        prevChecklist.map((item) =>
          item.id === selectedItem.id
            ? { ...item, notes: noteText }
            : item
        )
      );
      setShowNoteModal(false);
    }
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFD60A';
      case 'low':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const getRedFlags = (): string[] => {
    return checklist
      .filter((item) => item.completed && item.riskLevel === 'critical')
      .map((item) => `${item.item} (${item.category})`);
  };

  const generateReport = async () => {
    if (!propertyName.trim() || !inspectorName.trim()) {
      Alert.alert('Error', 'Please fill in property name and inspector name');
      return;
    }

    const redFlags = getRedFlags();
    const completedItems = checklist.filter((item) => item.completed);
    const criticalIssues = checklist.filter(
      (item) => item.completed && item.riskLevel === 'critical'
    );

    const report: InspectionReport = {
      id: `inspection-${Date.now()}`,
      propertyName,
      inspectionDate: new Date().toLocaleDateString(),
      inspector: inspectorName,
      items: checklist,
      overallCondition:
        criticalIssues.length > 2
          ? 'poor'
          : criticalIssues.length > 0
          ? 'fair'
          : completedItems.length > 10
          ? 'good'
          : 'excellent',
      redFlags,
      recommendations: [
        ...redFlags.map((flag) => `Address: ${flag}`),
        completedItems.length > 10 && 'Schedule professional inspection for identified issues',
        redFlags.length > 0 && 'Do not proceed with purchase until critical issues are resolved',
      ].filter(Boolean) as string[],
      estimatedRepairs: criticalIssues.length * 5000,
    };

    try {
      await addCalculation({
        type: 'inspection',
        name: `Inspection - ${propertyName} - ${new Date().toLocaleDateString()}`,
        data: report,
      });

      const csvContent = generateCSV(report);
      const fileName = `Inspection_${propertyName}_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Success', `Report saved to ${filePath}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
      console.error('Report generation error:', error);
    }
  };

  const generateCSV = (report: InspectionReport): string => {
    const lines = [
      'PROPERTY INSPECTION REPORT',
      `Property: ${report.propertyName}`,
      `Date: ${report.inspectionDate}`,
      `Inspector: ${report.inspector}`,
      `Overall Condition: ${report.overallCondition.toUpperCase()}`,
      '',
      'INSPECTION CHECKLIST',
      'Category,Item,Status,Risk Level,Notes',
      ...report.items.map((item) =>
        `"${item.category}","${item.item}","${item.completed ? 'ISSUE FOUND' : 'OK'}","${item.riskLevel}","${item.notes}"`
      ),
      '',
      'RED FLAGS',
      ...report.redFlags,
      '',
      'RECOMMENDATIONS',
      ...report.recommendations,
      '',
      `Estimated Repair Cost: $${report.estimatedRepairs.toLocaleString()}`,
    ];

    return lines.join('\n');
  };

  const filteredChecklist = filterCategory
    ? checklist.filter((item) => item.category === filterCategory)
    : checklist;

  const issuesFound = checklist.filter((item) => item.completed);
  const criticalIssues = issuesFound.filter((item) => item.riskLevel === 'critical');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Inspection Checklist</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Property Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter property name"
            value={propertyName}
            onChangeText={setPropertyName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Inspector Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter inspector name"
            value={inspectorName}
            onChangeText={setInspectorName}
          />
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{issuesFound.length}</Text>
          <Text style={styles.statLabel}>Issues Found</Text>
        </View>
        <View style={[styles.stat, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>
            {criticalIssues.length}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={[styles.stat, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
          <Text style={styles.statValue}>
            {Math.round((checklist.filter((i) => i.completed).length / checklist.length) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterButton, !filterCategory && styles.filterButtonActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                !filterCategory && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterCategory === category && styles.filterButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {categories.map((category) => {
          const categoryItems = filteredChecklist.filter((item) => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>

              {categoryItems.map((item) => (
                <View key={item.id} style={styles.checklistItem}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => toggleItem(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.completed && styles.checkboxChecked,
                      ]}
                    >
                      {item.completed && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemText,
                        item.completed && styles.itemTextCompleted,
                      ]}
                    >
                      {item.item}
                    </Text>
                    <View style={styles.itemMeta}>
                      <View
                        style={[
                          styles.riskBadge,
                          { backgroundColor: getRiskColor(item.riskLevel) },
                        ]}
                      >
                        <Text style={styles.riskText}>{item.riskLevel}</Text>
                      </View>
                      {item.notes && (
                        <Text style={styles.hasNotes}>📝 Has notes</Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.notesButton}
                    onPress={() => openNoteModal(item)}
                  >
                    <Text style={styles.notesButtonText}>📝</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {criticalIssues.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Critical Issues Found</Text>
          {criticalIssues.map((issue, index) => (
            <Text key={index} style={styles.warningText}>
              • {issue.item}
            </Text>
          ))}
          <Text style={styles.warningNote}>
            These issues must be addressed before purchase
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.generateButton} onPress={generateReport}>
        <Text style={styles.generateButtonText}>Generate & Export Report</Text>
      </TouchableOpacity>

      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <Text style={styles.modalItemName}>{selectedItem?.item}</Text>

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Add any notes about this item..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 14,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 120,
  },
  inputGroup: {
    marginBottom: 12,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  itemTextCompleted: {
    color: '#FF9500',
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  riskText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  hasNotes: {
    fontSize: 11,
    color: '#666',
  },
  notesButton: {
    padding: 8,
    marginLeft: 8,
  },
  notesButtonText: {
    fontSize: 16,
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
  warningNote: {
    fontSize: 11,
    color: '#856404',
    marginTop: 8,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#34C759',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  modalItemName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default InspectionChecklist;
