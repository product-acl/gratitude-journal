import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type PurchaseError,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - IMPORTANT: These must match your App Store Connect and Play Console products
const PRODUCT_IDS = {
  ios: 'com.diazleonardoacl.gratitudejournal.lifetime',
  android: 'lifetime_access',
};

const STORAGE_KEYS = {
  HAS_PURCHASED: 'has-purchased',
  TRIAL_START: 'first-open-date',
};

const TRIAL_LENGTH_DAYS = 7;

export class PurchaseManager {
  private static instance: PurchaseManager;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await initConnection();
      this.isInitialized = true;

      // Set up purchase listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener((purchase: ProductPurchase) => {
        this.handlePurchaseUpdate(purchase);
      });

      this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
        console.warn('Purchase error:', error);
      });

      console.log('IAP initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    await endConnection();
    this.isInitialized = false;
  }

  private async handlePurchaseUpdate(purchase: ProductPurchase): Promise<void> {
    try {
      // Verify the purchase (in production, you should verify with your backend)
      if (purchase.transactionReceipt) {
        // Mark as purchased
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_PURCHASED, 'true');
        console.log('Purchase successful:', purchase);

        // Finish the transaction
        await finishTransaction({ purchase, isConsumable: false });
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
    }
  }

  async getProduct() {
    try {
      const productId = Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
      const products = await getProducts({ skus: [productId] });

      if (products && products.length > 0) {
        return products[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting products:', error);
      return null;
    }
  }

  async purchase(): Promise<boolean> {
    try {
      const productId = Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android;

      await requestPurchase({ skus: [productId] });

      // The purchase will be handled by the listener
      return true;
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const purchases = await getAvailablePurchases();

      const productId = Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
      const hasPurchased = purchases.some(
        (purchase) => purchase.productId === productId
      );

      if (hasPurchased) {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_PURCHASED, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }

  async checkPurchaseStatus(): Promise<boolean> {
    // Check local storage first
    const storedPurchase = await AsyncStorage.getItem(STORAGE_KEYS.HAS_PURCHASED);
    if (storedPurchase === 'true') {
      return true;
    }

    // Also check with the store
    return await this.restorePurchases();
  }

  async getTrialInfo(): Promise<{
    isTrialActive: boolean;
    daysRemaining: number;
  }> {
    try {
      let firstOpenDate = await AsyncStorage.getItem(STORAGE_KEYS.TRIAL_START);

      if (!firstOpenDate) {
        firstOpenDate = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.TRIAL_START, firstOpenDate);
      }

      const trialStartDate = new Date(firstOpenDate);
      const now = new Date();
      const daysSinceStart = Math.floor(
        (now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, TRIAL_LENGTH_DAYS - daysSinceStart);
      const isTrialActive = daysRemaining > 0;

      return { isTrialActive, daysRemaining };
    } catch (error) {
      console.error('Error getting trial info:', error);
      return { isTrialActive: false, daysRemaining: 0 };
    }
  }

  // For testing only
  async resetPurchaseState(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_PURCHASED);
    await AsyncStorage.removeItem(STORAGE_KEYS.TRIAL_START);
  }
}

export const purchaseManager = PurchaseManager.getInstance();
