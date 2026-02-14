import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './src/gratitude/App';

export default function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}
