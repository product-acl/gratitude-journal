
import React from 'react';
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './gratitude/App';

const Root = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

const appName = 'GratitudeJournal';
AppRegistry.registerComponent(appName, () => Root);

export default Root;
  
