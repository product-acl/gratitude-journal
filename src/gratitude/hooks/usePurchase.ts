import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseManager } from '../services/PurchaseManager';

const HAS_SEEN_PAYWALL_KEY = 'has-seen-initial-paywall';

export interface PurchaseState {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  showPaywall: boolean;
  price: string;
  isFirstTimeWelcome: boolean;
}

export const usePurchase = () => {
  const [state, setState] = useState<PurchaseState>({
    isPremium: false,
    isTrialActive: false,
    trialDaysRemaining: 0,
    isLoading: true,
    showPaywall: false,
    price: '$9.99',
    isFirstTimeWelcome: false,
  });

  useEffect(() => {
    initializePurchases();

    return () => {
      // Cleanup when component unmounts
      void purchaseManager.cleanup();
    };
  }, []);

  const initializePurchases = async () => {
    try {
      // Initialize IAP connection
      await purchaseManager.initialize();

      // Check if user has already purchased
      const hasPurchased = await purchaseManager.checkPurchaseStatus();

      if (hasPurchased) {
        setState({
          isPremium: true,
          isTrialActive: false,
          trialDaysRemaining: 0,
          isLoading: false,
          showPaywall: false,
          price: '$9.99',
          isFirstTimeWelcome: false,
        });
        return;
      }

      // Check trial status
      const { isTrialActive, daysRemaining } = await purchaseManager.getTrialInfo();

      // Get product price
      const product = await purchaseManager.getProduct();
      const price = product?.localizedPrice || '$9.99';

      // Check if user has seen the initial paywall
      const hasSeenPaywall = await AsyncStorage.getItem(HAS_SEEN_PAYWALL_KEY);
      const shouldShowPaywall = !hasSeenPaywall || !isTrialActive;
      const isFirstTimeWelcome = !hasSeenPaywall && isTrialActive; // First time during trial

      setState({
        isPremium: false,
        isTrialActive,
        trialDaysRemaining: daysRemaining,
        isLoading: false,
        showPaywall: shouldShowPaywall, // Show on first open or when trial expires
        price,
        isFirstTimeWelcome,
      });
    } catch (error) {
      console.error('Error initializing purchases:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const completePurchase = async (): Promise<boolean> => {
    try {
      const success = await purchaseManager.purchase();

      if (success) {
        // The purchase will be handled by the listener in PurchaseManager
        // We just need to refresh the state
        await initializePurchases();
      }

      return success;
    } catch (error) {
      console.error('Error completing purchase:', error);
      return false;
    }
  };

  const restorePurchase = async (): Promise<boolean> => {
    try {
      const success = await purchaseManager.restorePurchases();

      if (success) {
        await initializePurchases();
      }

      return success;
    } catch (error) {
      console.error('Error restoring purchase:', error);
      return false;
    }
  };

  const dismissPaywall = async () => {
    if (state.isTrialActive) {
      // Mark that user has seen the initial paywall
      await AsyncStorage.setItem(HAS_SEEN_PAYWALL_KEY, 'true');
      setState(prev => ({ ...prev, showPaywall: false }));
    }
  };

  const showPaywallManually = () => {
    setState(prev => ({ ...prev, showPaywall: true, isFirstTimeWelcome: false }));
  };

  // For testing purposes - reset everything
  const resetPurchaseState = async () => {
    try {
      await AsyncStorage.removeItem(HAS_SEEN_PAYWALL_KEY);
      await purchaseManager.resetPurchaseState();
      await initializePurchases();
    } catch (error) {
      console.error('Error resetting purchase state:', error);
    }
  };

  return {
    ...state,
    completePurchase,
    restorePurchase,
    dismissPaywall,
    showPaywallManually,
    resetPurchaseState, // Only for testing
  };
};
