import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Alert } from 'react-native';

import StorageManager from './utils/storage';
import { useAppStore } from './store/store';

// Import all tools
import ROICalculator from './tools/ROICalculator';
import PropertyManager from './tools/PropertyManager';
import MortgageCalculator from './tools/MortgageCalculator';
import ClosingCostsBreakdown from './tools/ClosingCostsBreakdown';
import FolioRealTitleChecker from './tools/FolioRealTitleChecker';
import ResidencyGuide from './tools/ResidencyGuide';
import MarketHeatmap from './tools/MarketHeatmap';
import InspectionChecklist from './tools/InspectionChecklist';
import Toolbox from './tools/Toolbox';
import PortfolioAnalytics from './tools/PortfolioAnalytics';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await StorageManager.createTables();

      // Load persisted data
      const savedData = await StorageManager.getItem('puraestate-store');
      if (savedData) {
        console.log('Previous session data loaded');
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Initialization Error', 'Failed to initialize the application');
    }
  };

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#999',
    tabBarStyle: {
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingBottom: 8,
      paddingTop: 8,
    },
  };

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Toolbox"
          component={Toolbox}
          options={{
            tabBarLabel: 'Toolbox',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧰</Text>,
          }}
        />

        <Tab.Screen
          name="ROI"
          component={ROICalculator}
          options={{
            tabBarLabel: 'ROI',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          }}
        />

        <Tab.Screen
          name="Properties"
          component={PropertyManager}
          options={{
            tabBarLabel: 'Properties',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          }}
        />

        <Tab.Screen
          name="Portfolio"
          component={PortfolioAnalytics}
          options={{
            tabBarLabel: 'Portfolio',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📈</Text>,
          }}
        />

        <Tab.Screen
          name="Mortgage"
          component={MortgageCalculator}
          options={{
            tabBarLabel: 'Mortgage',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
