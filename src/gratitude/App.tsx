import { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Pressable, Share, StyleSheet, Text, View, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home } from './components/Home';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { EntryDetail } from './components/EntryDetail';
import { Paywall } from './components/Paywall';
import type { Entry } from './components/History';
import { usePurchase } from './hooks/usePurchase';
import { Analytics } from './services/analytics';
import * as StoreReview from 'expo-store-review';

type Screen = 'home' | 'history' | 'settings';
const STORAGE_KEY = 'gratitude-entries';
const RATING_LAST_MILESTONE_KEY = 'rating-last-milestone';
const RATING_MILESTONES = [3, 10, 30];
const NAV_HEIGHT = 72;

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [streak, setStreak] = useState(0);
  const [dateKey, setDateKey] = useState(() => new Date().toDateString());
  const insets = useSafeAreaInsets();

  // Track screen changes
  useEffect(() => {
    void Analytics.logScreenView(currentScreen);

    // Track history views with entry count
    if (currentScreen === 'history') {
      void Analytics.logHistoryViewed(entries.length);
    }
  }, [currentScreen, entries.length]);

  // Purchase state
  const purchase = usePurchase();

  // Track app open and set user properties
  useEffect(() => {
    void Analytics.logAppOpen();
    void Analytics.setUserPremiumStatus(purchase.isPremium);
    void Analytics.setUserTrialStatus(purchase.isTrialActive);
  }, [purchase.isPremium, purchase.isTrialActive]);

  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      return;
    }
    const setupNotifications = async () => {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }
    };

    void setupNotifications();
  }, []);

  // Load entries from storage
  useEffect(() => {
    let isMounted = true;
    const loadEntries = async () => {
      try {
        const savedEntries = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedEntries && isMounted) {
          setEntries(JSON.parse(savedEntries));
        }
      } catch (error) {
        console.warn('Failed to load entries', error);
      }
    };

    void loadEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistEntries = async (nextEntries: Entry[]) => {
    setEntries(nextEntries);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    } catch (error) {
      console.warn('Failed to save entries', error);
    }
  };

  // Recalculate streak when app returns to foreground on a new day
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date().toDateString();
        setDateKey(prev => prev !== now ? now : prev);
      }
    });
    return () => sub.remove();
  }, []);

  // Calculate streak
  useEffect(() => {
    if (entries.length === 0) {
      setStreak(0);
      return;
    }

    const oneDayMs = 86400000;

    // Deduplicate entry dates (normalized to midnight), sorted newest first
    const uniqueDates = [
      ...new Set(
        entries.map((e) => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      ),
    ].sort((a, b) => b - a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const mostRecentDate = uniqueDates[0];

    // If most recent entry is older than yesterday, streak is broken
    if (mostRecentDate < todayMs - oneDayMs) {
      setStreak(0);
      return;
    }

    // Count consecutive days starting from the most recent entry date
    let currentStreak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = mostRecentDate - i * oneDayMs;
      if (uniqueDates[i] === expectedDate) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);

    // Track streak milestones
    if (currentStreak > 0) {
      void Analytics.logStreakMilestone(currentStreak);
    }
  }, [entries, dateKey]);

  const maybeRequestReview = async (totalEntries: number) => {
    if (!RATING_MILESTONES.includes(totalEntries)) return;
    try {
      const lastMilestone = await AsyncStorage.getItem(RATING_LAST_MILESTONE_KEY);
      if (lastMilestone && parseInt(lastMilestone) >= totalEntries) return;
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable && !__DEV__) return;
      await AsyncStorage.setItem(RATING_LAST_MILESTONE_KEY, String(totalEntries));
      await StoreReview.requestReview();
    } catch (error) {
      console.warn('Failed to request review', error);
    }
  };

  const handleSaveEntry = (entry: { grateful: string; goodToday: string; appreciate: string }) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...entry
    };

    const updatedEntries = [newEntry, ...entries];
    void persistEntries(updatedEntries);

    // Track entry creation
    void Analytics.logEntryCreated();

    // Prompt for app store review after 3rd entry
    void maybeRequestReview(updatedEntries.length);
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = entries.filter(e => e.id !== entryId);
    void persistEntries(updatedEntries);
    setSelectedEntry(null);

    // Track entry deletion
    void Analytics.logEntryDeleted();
  };

  const handleEditEntry = (updatedEntry: Entry) => {
    const updatedEntries = entries.map(e =>
      e.id === updatedEntry.id ? updatedEntry : e
    );
    void persistEntries(updatedEntries);
    setSelectedEntry(null);

    // Track entry edit
    void Analytics.logEntryEdited();
  };

  const handleExport = async () => {
    try {
      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const rows = [
        ['id', 'date', 'grateful', 'goodToday', 'appreciate'],
        ...entries.map((entry) => [
          entry.id,
          entry.date,
          entry.grateful,
          entry.goodToday,
          entry.appreciate,
        ]),
      ];
      const csvStr = rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(',')).join('\n');
      const fileName = `gratitude-journal-entries-${Date.now()}.csv`;

      // Create file in cache directory (works in Expo Go)
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvStr);

      // Share the file using expo-sharing (works on both platforms)
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Gratitude Journal Entries',
        UTI: 'public.comma-separated-values-text',
      });

      // Track data export
      void Analytics.logDataExport(entries.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export entries right now.';
      console.error('Export error:', error);
      Alert.alert('Export failed', message);
    }
  };

  const handlePurchase = async () => {
    try {
      // Track purchase initiation
      void Analytics.logPurchaseInitiated(purchase.price);

      const success = await purchase.completePurchase();
      if (success) {
        // Track successful purchase
        void Analytics.logPurchaseComplete(purchase.price);
        void Analytics.setUserPremiumStatus(true);

        Alert.alert('Success!', 'Thank you for your purchase! You now have lifetime access.');
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
    }
  };

  const handleRestorePurchase = async () => {
    // Track restore attempt
    void Analytics.logRestorePurchase();

    const success = await purchase.restorePurchase();
    if (success) {
      void Analytics.setUserPremiumStatus(true);
      Alert.alert('Restored!', 'Your purchase has been restored successfully.');
    } else {
      Alert.alert('No Purchase Found', 'We could not find any previous purchases to restore.');
    }
  };

  const handleDeleteAllData = async () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete all your journal entries, settings, and app data. This action cannot be undone.\n\nConsider exporting your entries first.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export First',
          onPress: handleExport,
        },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all app data
              await AsyncStorage.clear();

              // Reset state
              setEntries([]);
              setStreak(0);
              setSelectedEntry(null);

              Alert.alert('Data Deleted', 'All your data has been permanently deleted.');
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Paywall Modal */}
      {purchase.showPaywall && !purchase.isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.paywallOverlay]}>
          <Paywall
            onStartTrial={() => {
              void Analytics.logPaywallDismiss(purchase.trialDaysRemaining);
              purchase.dismissPaywall();
            }}
            onPurchase={handlePurchase}
            onRestore={handleRestorePurchase}
            trialDaysRemaining={purchase.trialDaysRemaining}
            price={purchase.price}
            isFirstTime={purchase.isFirstTimeWelcome}
          />
          {purchase.isTrialActive && (
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                void Analytics.logPaywallDismiss(purchase.trialDaysRemaining);
                purchase.dismissPaywall();
              }}
            >
              <Feather name="x" size={24} color="white" />
            </Pressable>
          )}
        </View>
      )}

      <View style={[styles.content, { paddingBottom: NAV_HEIGHT + insets.bottom }]}>
        {currentScreen === 'home' && (
          <Home streak={streak} onSave={handleSaveEntry} />
        )}
        {currentScreen === 'history' && (
          <History
            entries={sortedEntries}
            onSelectEntry={(entry) => {
              setSelectedEntry(entry);
              void Analytics.logEntryDetailViewed();
            }}
          />
        )}
        {currentScreen === 'settings' && (
          <Settings
            onExport={handleExport}
            isPremium={purchase.isPremium}
            isTrialActive={purchase.isTrialActive}
            trialDaysRemaining={purchase.trialDaysRemaining}
            onUpgrade={purchase.showPaywallManually}
            onDeleteAllData={handleDeleteAllData}
          />
        )}
      </View>

      <View style={[styles.nav, { paddingBottom: insets.bottom }]}>
        <View style={styles.navInner}>
          <Pressable
            onPress={() => setCurrentScreen('home')}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            <Feather name="home" size={30} color={currentScreen === 'home' ? '#4F46E5' : '#9CA3AF'} />
            <Text style={[styles.navLabel, currentScreen === 'home' && styles.navLabelActive]}>Home</Text>
          </Pressable>

          <Pressable
            onPress={() => setCurrentScreen('history')}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            <Feather name="clock" size={30} color={currentScreen === 'history' ? '#4F46E5' : '#9CA3AF'} />
            <Text style={[styles.navLabel, currentScreen === 'history' && styles.navLabelActive]}>
              History
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCurrentScreen('settings')}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            <Feather name="settings" size={30} color={currentScreen === 'settings' ? '#4F46E5' : '#9CA3AF'} />
            <Text style={[styles.navLabel, currentScreen === 'settings' && styles.navLabelActive]}>
              Settings
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Entry detail modal */}
      {selectedEntry && (
        <EntryDetail 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
        />
      )}
    </SafeAreaView>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingBottom: 90,
  },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: NAV_HEIGHT,
  },
  navButton: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  navButtonPressed: {
    opacity: 0.8,
  },
  navLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  navLabelActive: {
    color: '#4F46E5',
  },
  paywallOverlay: {
    zIndex: 999,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
