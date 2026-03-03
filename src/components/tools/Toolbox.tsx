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

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'calculation' | 'management' | 'analysis' | 'guide';
  component?: React.ComponentType<any>;
}

interface SavedWorkflow {
  id: string;
  name: string;
  description: string;
  tools: string[];
  savedAt: number;
}

interface SavedTemplate {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
}

const TOOLS: Tool[] = [
  {
    id: 'roi-calculator',
    name: 'ROI Investment Calculator',
    description: 'Calculate cap rate, cash-on-cash returns, and rental projections',
    icon: '📊',
    category: 'calculation',
  },
  {
    id: 'property-manager',
    name: 'Property Manager',
    description: 'Track tenants, rent payments, and maintenance requests',
    icon: '🏠',
    category: 'management',
  },
  {
    id: 'mortgage-calculator',
    name: 'Mortgage Calculator',
    description: 'Calculate payments with international bank rates',
    icon: '💰',
    category: 'calculation',
  },
  {
    id: 'closing-costs',
    name: 'Closing Costs Breakdown',
    description: 'Calculate taxes, fees, and total closing costs by country',
    icon: '📝',
    category: 'calculation',
  },
  {
    id: 'title-checker',
    name: 'Folio Real Title Checker',
    description: 'Verify property titles and check for liens',
    icon: '✓',
    category: 'management',
  },
  {
    id: 'residency-guide',
    name: 'Residency Guide',
    description: 'Compare residency visas and requirements',
    icon: '📋',
    category: 'guide',
  },
  {
    id: 'market-heatmap',
    name: 'Market Heatmap',
    description: 'Analyze price trends and market demand',
    icon: '🗺️',
    category: 'analysis',
  },
  {
    id: 'inspection-checklist',
    name: 'Inspection Checklist',
    description: 'Complete property inspection with PDF export',
    icon: '✅',
    category: 'management',
  },
  {
    id: 'portfolio-analytics',
    name: 'Portfolio Analytics',
    description: 'Track all properties and performance metrics',
    icon: '📈',
    category: 'analysis',
  },
];

const WORKFLOW_TEMPLATES: SavedWorkflow[] = [
  {
    id: 'w1',
    name: 'Pre-Purchase Due Diligence',
    description: 'Complete workflow for evaluating a property',
    tools: ['title-checker', 'inspection-checklist', 'closing-costs', 'roi-calculator'],
    savedAt: Date.now(),
  },
  {
    id: 'w2',
    name: 'Rental Property Setup',
    description: 'Set up a new rental property',
    tools: ['property-manager', 'roi-calculator', 'market-heatmap'],
    savedAt: Date.now(),
  },
  {
    id: 'w3',
    name: 'Investment Analysis',
    description: 'Complete investment analysis',
    tools: ['roi-calculator', 'mortgage-calculator', 'closing-costs', 'market-heatmap'],
    savedAt: Date.now(),
  },
];

const Toolbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tools' | 'workflows' | 'templates' | 'settings'>('tools');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>(WORKFLOW_TEMPLATES);
  const { calculations, properties, language, currency, setLanguage, setCurrency } =
    useAppStore();

  const categories = ['calculation', 'management', 'analysis', 'guide'];

  const categoryEmoji: Record<string, string> = {
    calculation: '🧮',
    management: '🏢',
    analysis: '📊',
    guide: '📚',
  };

  const categoryLabel: Record<string, string> = {
    calculation: 'Calculations',
    management: 'Management',
    analysis: 'Analysis',
    guide: 'Guides',
  };

  const filteredTools = selectedCategory
    ? TOOLS.filter((tool) => tool.category === selectedCategory)
    : TOOLS;

  const toggleToolSelection = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((id) => id !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      Alert.alert('Error', 'Please enter a workflow name');
      return;
    }

    if (selectedTools.length === 0) {
      Alert.alert('Error', 'Please select at least one tool');
      return;
    }

    const newWorkflow: SavedWorkflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      tools: selectedTools,
      savedAt: Date.now(),
    };

    setSavedWorkflows([...savedWorkflows, newWorkflow]);
    Alert.alert('Success', 'Workflow saved successfully');

    setWorkflowName('');
    setWorkflowDescription('');
    setSelectedTools([]);
    setShowWorkflowModal(false);
  };

  const renderToolItem = ({ item }: { item: Tool }) => (
    <TouchableOpacity style={styles.toolCard}>
      <Text style={styles.toolIcon}>{item.icon}</Text>
      <View style={styles.toolContent}>
        <Text style={styles.toolName}>{item.name}</Text>
        <Text style={styles.toolDescription}>{item.description}</Text>
      </View>
      <Text style={styles.toolArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderWorkflowItem = ({ item }: { item: SavedWorkflow }) => (
    <View style={styles.workflowCard}>
      <View>
        <Text style={styles.workflowName}>{item.name}</Text>
        <Text style={styles.workflowDescription}>{item.description}</Text>
        <View style={styles.workflowTools}>
          {item.tools.map((toolId) => {
            const tool = TOOLS.find((t) => t.id === toolId);
            return (
              <View key={toolId} style={styles.workflowToolTag}>
                <Text style={styles.workflowToolTagText}>{tool?.name}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <TouchableOpacity style={styles.workflowAction}>
        <Text style={styles.workflowActionText}>Start</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryCard = ({ item }: { item: string }) => {
    const categoryTools = TOOLS.filter((tool) => tool.category === item);
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          selectedCategory === item && styles.categoryCardSelected,
        ]}
        onPress={() =>
          setSelectedCategory(selectedCategory === item ? null : item)
        }
      >
        <Text style={styles.categoryEmoji}>{categoryEmoji[item]}</Text>
        <Text style={styles.categoryName}>{categoryLabel[item]}</Text>
        <Text style={styles.categoryCount}>{categoryTools.length}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PuraEstate Toolbox</Text>
        <Text style={styles.subtitle}>Complete real estate investment toolkit</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tools' && styles.tabActive]}
          onPress={() => setActiveTab('tools')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'tools' && styles.tabTextActive,
            ]}
          >
            Tools
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workflows' && styles.tabActive]}
          onPress={() => setActiveTab('workflows')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'workflows' && styles.tabTextActive,
            ]}
          >
            Workflows
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.tabTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'tools' && (
          <View>
            <Text style={styles.sectionTitle}>Filter by Category</Text>
            <FlatList
              scrollEnabled={false}
              data={categories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item}
              numColumns={2}
              columnWrapperStyle={styles.categoryGrid}
            />

            <Text style={styles.sectionTitle}>
              {selectedCategory ? categoryLabel[selectedCategory] : 'All Tools'}
            </Text>
            <FlatList
              scrollEnabled={false}
              data={filteredTools}
              renderItem={renderToolItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}

        {activeTab === 'workflows' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowWorkflowModal(true)}
            >
              <Text style={styles.addButtonText}>+ Create Custom Workflow</Text>
            </TouchableOpacity>

            {savedWorkflows.map((workflow) => (
              <View key={workflow.id} style={styles.workflowCard}>
                <View>
                  <Text style={styles.workflowName}>{workflow.name}</Text>
                  <Text style={styles.workflowDescription}>
                    {workflow.description}
                  </Text>
                  <View style={styles.workflowTools}>
                    {workflow.tools.map((toolId) => {
                      const tool = TOOLS.find((t) => t.id === toolId);
                      return (
                        <View key={toolId} style={styles.workflowToolTag}>
                          <Text style={styles.workflowToolTagText}>
                            {tool?.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <TouchableOpacity style={styles.workflowAction}>
                  <Text style={styles.workflowActionText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'settings' && (
          <View>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>App Settings</Text>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Language</Text>
                <View style={styles.settingOptions}>
                  <TouchableOpacity
                    style={[
                      styles.option,
                      language === 'en' && styles.optionActive,
                    ]}
                    onPress={() => setLanguage('en')}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        language === 'en' && styles.optionTextActive,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.option,
                      language === 'es' && styles.optionActive,
                    ]}
                    onPress={() => setLanguage('es')}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        language === 'es' && styles.optionTextActive,
                      ]}
                    >
                      Spanish
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Default Currency</Text>
                <View style={styles.settingOptions}>
                  {['USD', 'CRC', 'EUR', 'CAD'].map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.option,
                        currency === curr && styles.optionActive,
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          currency === curr && styles.optionTextActive,
                        ]}
                      >
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Activity</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Properties</Text>
                <Text style={styles.statValue}>{properties.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Calculations Saved</Text>
                <Text style={styles.statValue}>{calculations.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Custom Workflows</Text>
                <Text style={styles.statValue}>
                  {savedWorkflows.filter((w) => w.id.startsWith('workflow-')).length}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Workflow Modal */}
      <Modal
        visible={showWorkflowModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkflowModal(false)}
      >
        <View style={styles.modal}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Workflow</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workflow Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Property Analysis"
                value={workflowName}
                onChangeText={setWorkflowName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Describe what this workflow does"
                value={workflowDescription}
                onChangeText={setWorkflowDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Tools</Text>
              {TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={styles.toolCheckItem}
                  onPress={() => toggleToolSelection(tool.id)}
                >
                  <View
                    style={[
                      styles.toolCheckbox,
                      selectedTools.includes(tool.id) &&
                      styles.toolCheckboxChecked,
                    ]}
                  >
                    {selectedTools.includes(tool.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <View style={styles.toolCheckContent}>
                    <Text style={styles.toolCheckName}>{tool.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={saveWorkflow}
            >
              <Text style={styles.submitButtonText}>Create Workflow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowWorkflowModal(false)}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  tabContainer: {
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
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 16,
    color: '#333',
  },
  categoryGrid: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCardSelected: {
    backgroundColor: '#007AFF',
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  toolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  toolContent: {
    flex: 1,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: '#999',
  },
  toolArrow: {
    fontSize: 16,
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  workflowCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workflowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  workflowDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  workflowTools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  workflowToolTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  workflowToolTagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  workflowAction: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  workflowActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  settingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
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
    minHeight: 80,
  },
  toolCheckItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  toolCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolCheckboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  toolCheckContent: {
    flex: 1,
  },
  toolCheckName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 8,
    paddingVertical: 14,
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
});

export default Toolbox;
