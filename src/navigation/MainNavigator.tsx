// src/navigation/MainNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList } from '../types/common';
import { COLORS } from '../styles/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PropertySearchScreen from '../screens/PropertySearchScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import AIMatchingScreen from '../screens/AIMatchingScreen';
import MyPropertiesScreen from '../screens/MyPropertiesScreen';
import AgentsScreen from '../screens/AgentsScreen';
import MarketAnalyticsScreen from '../screens/MarketAnalyticsScreen';
import ToolsScreen from '../screens/ToolsScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

const SearchStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PropertySearch"
        component={PropertySearchScreen}
        options={{
          title: 'Search Properties',
        }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{
          title: 'Property Details',
        }}
      />
    </Stack.Navigator>
  );
};

const AIMatchingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AIMatching" component={AIMatchingScreen} />
    </Stack.Navigator>
  );
};

const MyPropertiesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </Stack.Navigator>
  );
};

const AgentsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Agents" component={AgentsScreen} />
    </Stack.Navigator>
  );
};

const AnalyticsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MarketAnalytics" component={MarketAnalyticsScreen} />
    </Stack.Navigator>
  );
};

const ToolsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tools" component={ToolsScreen} />
    </Stack.Navigator>
  );
};

const AccountStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PropertySearch') {
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'MyProperties') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Agents') {
            iconName = focused ? 'account-multiple' : 'account-multiple-outline';
          } else if (route.name === 'MarketAnalytics') {
            iconName = focused ? 'chart-box' : 'chart-box-outline';
          } else if (route.name === 'Tools') {
            iconName = focused ? 'toolbox' : 'toolbox-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border.primary,
          borderTopWidth: 1,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="PropertySearch"
        component={SearchStackNavigator}
        options={{
          title: 'Search',
        }}
      />
      <Tab.Screen
        name="MyProperties"
        component={MyPropertiesStackNavigator}
        options={{
          title: 'My Properties',
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsStackNavigator}
        options={{
          title: 'Agents',
        }}
      />
      <Tab.Screen
        name="MarketAnalytics"
        component={AnalyticsStackNavigator}
        options={{
          title: 'Analytics',
        }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsStackNavigator}
        options={{
          title: 'Tools',
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{
          title: 'Account',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
