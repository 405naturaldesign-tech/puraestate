// src/navigation/NavigationContainer.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { setUser } from '../redux/slices/authSlice';
import logger from '../utils/logger';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Loader from '../components/common/Loader';

const Stack = createNativeStackNavigator();

const NavigationSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          logger.info('Auth token found, user is authenticated');
        } else {
          logger.info('No auth token found');
        }
      } catch (error) {
        logger.error('Error checking auth', error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  if (isInitializing) {
    return <Loader />;
  }

  return (
    <RNNavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        )}
      </Stack.Navigator>
    </RNNavigationContainer>
  );
};

export default NavigationSetup;
