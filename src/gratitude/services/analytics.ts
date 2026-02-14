import analytics from '@react-native-firebase/analytics';

/**
 * Analytics service for tracking user events and behavior
 * All user data remains on-device; only anonymous events are logged
 */

export const Analytics = {
  /**
   * Track app open event
   */
  logAppOpen: async () => {
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.warn('Analytics error (logAppOpen):', error);
    }
  },

  /**
   * Track paywall view
   * @param variant - Type of paywall shown (welcome, upgrade, expired)
   * @param daysRemaining - Days left in trial
   */
  logPaywallView: async (variant: 'welcome' | 'upgrade' | 'expired', daysRemaining: number) => {
    try {
      await analytics().logEvent('paywall_view', {
        variant,
        trial_days_remaining: daysRemaining,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logPaywallView):', error);
    }
  },

  /**
   * Track paywall dismissal (when user closes during trial)
   */
  logPaywallDismiss: async (daysRemaining: number) => {
    try {
      await analytics().logEvent('paywall_dismiss', {
        trial_days_remaining: daysRemaining,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logPaywallDismiss):', error);
    }
  },

  /**
   * Track when user initiates purchase flow
   * @param price - Price of the product
   */
  logPurchaseInitiated: async (price: string) => {
    try {
      await analytics().logEvent('begin_checkout', {
        currency: 'USD',
        value: parseFloat(price.replace('$', '')),
        items: [
          {
            item_id: 'lifetime_access',
            item_name: 'Lifetime Access',
          },
        ],
      });
    } catch (error) {
      console.warn('Analytics error (logPurchaseInitiated):', error);
    }
  },

  /**
   * Track successful purchase
   * @param price - Price of the product
   */
  logPurchaseComplete: async (price: string) => {
    try {
      await analytics().logEvent('purchase', {
        currency: 'USD',
        value: parseFloat(price.replace('$', '')),
        transaction_id: Date.now().toString(),
        items: [
          {
            item_id: 'lifetime_access',
            item_name: 'Lifetime Access',
          },
        ],
      });
    } catch (error) {
      console.warn('Analytics error (logPurchaseComplete):', error);
    }
  },

  /**
   * Track purchase restoration attempt
   */
  logRestorePurchase: async () => {
    try {
      await analytics().logEvent('restore_purchase', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logRestorePurchase):', error);
    }
  },

  /**
   * Track gratitude entry creation
   * NOTE: We don't log entry content for privacy - only that an entry was made
   */
  logEntryCreated: async () => {
    try {
      await analytics().logEvent('entry_created', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logEntryCreated):', error);
    }
  },

  /**
   * Track entry deletion
   */
  logEntryDeleted: async () => {
    try {
      await analytics().logEvent('entry_deleted', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logEntryDeleted):', error);
    }
  },

  /**
   * Track entry edit
   */
  logEntryEdited: async () => {
    try {
      await analytics().logEvent('entry_edited', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logEntryEdited):', error);
    }
  },

  /**
   * Track when user views their entry history
   * @param entryCount - Number of entries the user has
   */
  logHistoryViewed: async (entryCount: number) => {
    try {
      await analytics().logEvent('history_viewed', {
        entry_count: entryCount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logHistoryViewed):', error);
    }
  },

  /**
   * Track when user opens an entry detail
   */
  logEntryDetailViewed: async () => {
    try {
      await analytics().logEvent('entry_detail_viewed', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logEntryDetailViewed):', error);
    }
  },

  /**
   * Track data export
   */
  logDataExport: async (entryCount: number) => {
    try {
      await analytics().logEvent('data_export', {
        entry_count: entryCount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logDataExport):', error);
    }
  },

  /**
   * Track screen view
   * @param screenName - Name of the screen
   */
  logScreenView: async (screenName: string) => {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    } catch (error) {
      console.warn('Analytics error (logScreenView):', error);
    }
  },

  /**
   * Track streak milestone
   * @param streakDays - Current streak in days
   */
  logStreakMilestone: async (streakDays: number) => {
    try {
      // Only log milestones at specific intervals
      const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
      if (milestones.includes(streakDays)) {
        await analytics().logEvent('streak_milestone', {
          streak_days: streakDays,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.warn('Analytics error (logStreakMilestone):', error);
    }
  },

  /**
   * Track trial expiration
   */
  logTrialExpired: async () => {
    try {
      await analytics().logEvent('trial_expired', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics error (logTrialExpired):', error);
    }
  },

  /**
   * Set user property for premium status
   * @param isPremium - Whether user has premium access
   */
  setUserPremiumStatus: async (isPremium: boolean) => {
    try {
      await analytics().setUserProperty('premium_status', isPremium ? 'premium' : 'free');
    } catch (error) {
      console.warn('Analytics error (setUserPremiumStatus):', error);
    }
  },

  /**
   * Set user property for trial status
   * @param isTrialActive - Whether user is in active trial
   */
  setUserTrialStatus: async (isTrialActive: boolean) => {
    try {
      await analytics().setUserProperty('trial_status', isTrialActive ? 'active' : 'expired');
    } catch (error) {
      console.warn('Analytics error (setUserTrialStatus):', error);
    }
  },
};
