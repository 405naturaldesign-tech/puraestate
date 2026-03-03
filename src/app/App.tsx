// src/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './redux/store';
import NavigationSetup from './navigation/NavigationContainer';
import { initializeApp } from './services/firebase';
import { setupLogger } from './utils/logger';
import ErrorBoundary from './components/common/ErrorBoundary';
import { customTheme } from './styles/theme';

// Initialize services
setupLogger();
initializeApp();

const App: React.FC = () => {
  useEffect(() => {
    // Any global initialization
    console.log('PuraEstate App initialized');
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PaperProvider theme={customTheme}>
          <SafeAreaProvider>
            <NavigationContainer>
              <NavigationSetup />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
