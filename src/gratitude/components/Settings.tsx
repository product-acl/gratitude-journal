import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';

interface SettingsProps {
  onExport: () => void;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  onUpgrade: () => void;
  onDeleteAllData: () => void;
}

const SETTINGS_KEY = 'gratitude-settings';
const REMINDER_ID_KEY = 'gratitude-reminder-id';
const NOTIFICATION_UNAVAILABLE_MESSAGE =
  'Notifications require a development build on Android (Expo Go does not support them).';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

const isExpoGo = Constants.appOwnership === 'expo';

export function Settings({ onExport, isPremium, isTrialActive, trialDaysRemaining, onUpgrade, onDeleteAllData }: SettingsProps) {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderSaved, setReminderSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored) as {
            reminderEnabled?: boolean;
            reminderTime?: string;
          };
          if (typeof parsed.reminderEnabled === 'boolean') {
            setReminderEnabled(parsed.reminderEnabled);
          }
          if (typeof parsed.reminderTime === 'string') {
            setReminderTime(parsed.reminderTime);
          }
        }
      } catch (error) {
        console.warn('Failed to load settings', error);
      }
    };

    void loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const persistSettings = async (nextEnabled: boolean, nextTime: string) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ reminderEnabled: nextEnabled, reminderTime: nextTime })
      );
    } catch (error) {
      console.warn('Failed to save settings', error);
    }
  };

  const getNotifications = async () => {
    if (isExpoGo) return null;
    return import('expo-notifications');
  };

  const ensureNotificationPermission = async () => {
    const Notifications = await getNotifications();
    if (!Notifications) {
      Alert.alert('Notifications unavailable', NOTIFICATION_UNAVAILABLE_MESSAGE);
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      setPermissionStatus(current.status);
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    setPermissionStatus(requested.status);
    return requested.status === 'granted';
  };

  const cancelReminder = async () => {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    const reminderId = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (reminderId) {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      await AsyncStorage.removeItem(REMINDER_ID_KEY);
    }
  };

  const scheduleDailyReminder = async (time: string) => {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    const [hourStr, minuteStr] = time.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error('Invalid time');
    }

    await cancelReminder();

    const trigger =
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'reminders',
          }
        : {
            hour,
            minute,
            repeats: true,
          };

    const reminderId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '30-Second Gratitude Journal',
        body: 'Take a moment to log today’s gratitude.',
        sound: 'default',
      },
      trigger,
    });

    await AsyncStorage.setItem(REMINDER_ID_KEY, reminderId);
  };

  const handleSaveReminder = () => {
    // NOTE: this is UI-only for MVP. We’re not scheduling notifications yet.
    void persistSettings(reminderEnabled, reminderTime);
    void (async () => {
      if (!reminderEnabled) {
        await cancelReminder();
        return;
      }
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        return;
      }
      await scheduleDailyReminder(reminderTime);
    })();
    setReminderSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setReminderSaved(false), 2000);
  };

  const toggleReminder = () => {
    setReminderEnabled((prev) => {
      const nextEnabled = !prev;
      void persistSettings(nextEnabled, reminderTime);
      void (async () => {
        if (!nextEnabled) {
          await cancelReminder();
          return;
        }
        const allowed = await ensureNotificationPermission();
        if (!allowed) {
          return;
        }
        await scheduleDailyReminder(reminderTime);
      })();
      return nextEnabled;
    });
  };

  const handleTestNotification = async () => {
    const Notifications = await getNotifications();
    if (!Notifications) {
      Alert.alert('Notifications unavailable', NOTIFICATION_UNAVAILABLE_MESSAGE);
      return;
    }
    const allowed = await ensureNotificationPermission();
    if (!allowed) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test reminder',
        body: 'This is a test notification.',
        sound: 'default',
      },
      trigger: { seconds: 2, channelId: 'reminders' },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Premium Status */}
        {isPremium ? (
          <View style={styles.premiumBox}>
            <Feather name="star" size={24} color="#4F46E5" />
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Premium Member</Text>
              <Text style={styles.premiumText}>Thank you for your support!</Text>
            </View>
          </View>
        ) : isTrialActive ? (
          <View style={styles.trialBox}>
            <Feather name="gift" size={24} color="#4F46E5" />
            <View style={styles.trialContent}>
              <Text style={styles.trialTitle}>
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Day' : 'Days'} Left in Free Trial
              </Text>
              <Pressable onPress={onUpgrade}>
                <Text style={styles.upgradeLink}>Unlock Lifetime Access →</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.upgradeBox}>
            <Feather name="lock" size={24} color="#F59E0B" />
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>Free Trial Ended</Text>
              <Pressable
                onPress={onUpgrade}
                style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}
              >
                <Text style={styles.upgradeButtonText}>Unlock Now</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily reminder</Text>
          <Pressable
            onPress={toggleReminder}
            style={({ pressed }) => [styles.switch, reminderEnabled && styles.switchOn, pressed && styles.pressed]}
            accessibilityRole="switch"
            accessibilityState={{ checked: reminderEnabled }}
          >
            <View style={[styles.knob, reminderEnabled && styles.knobOn]} />
          </Pressable>
        </View>

        {reminderEnabled && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                You’ll receive a simple notification at your chosen time each day to remind you to journal.
              </Text>
              <Text style={styles.infoNote}>
                Note: you’ll need to enable notifications in your device settings for this to work.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Reminder time (HH:MM)</Text>
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="09:00"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                style={styles.input}
              />
              <Text style={styles.helper}>
                Tip: format 24h like 07:30 or 18:05.
              </Text>
            </View>

            <Pressable
              onPress={handleSaveReminder}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Save Reminder Settings</Text>
            </Pressable>

            <Pressable
              onPress={handleTestNotification}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
            >
              <Text style={styles.outlineButtonText}>Send Test Notification</Text>
            </Pressable>

            {isExpoGo && (
              <Text style={styles.infoNote}>{NOTIFICATION_UNAVAILABLE_MESSAGE}</Text>
            )}

            {reminderSaved && (
              <Text style={styles.savedText}>Settings saved ✓</Text>
            )}
          </>
        )}

        <View style={styles.section}>
          <Pressable
            onPress={onExport}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
          >
            <Text style={styles.outlineButtonText}>Export Entries</Text>
          </Pressable>

          <Pressable
            onPress={onDeleteAllData}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
          >
            <Feather name="trash-2" size={18} color="white" />
            <Text style={styles.dangerButtonText}>Delete All Data</Text>
          </Pressable>
        </View>

        <View style={styles.linksSection}>
          <Pressable
            onPress={() => {
              // This will be handled by the parent component
              Alert.alert(
                'Privacy Policy',
                'Please visit our website to view the full privacy policy.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>All entries stored locally on your device</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'white',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingBottom: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: {
    fontSize: 16,
    color: '#111827',
  },

  switch: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#4F46E5',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  knobOn: {
    transform: [{ translateX: 20 }],
  },

  infoBox: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
  },
  infoNote: {
    fontSize: 12,
    color: '#6B7280',
  },

  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 12,
  },
  helper: {
    fontSize: 12,
    color: '#6B7280',
  },

  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  savedText: {
    textAlign: 'center',
    color: '#4F46E5',
    fontWeight: '700',
    marginTop: 2,
  },

  section: {
    marginTop: 10,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '800',
  },

  footerText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.9,
  },

  // Premium/Trial status boxes
  premiumBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  premiumText: {
    fontSize: 14,
    color: '#6B7280',
  },

  trialBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trialContent: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  upgradeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },

  upgradeBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },

  dangerButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  linksSection: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
});
