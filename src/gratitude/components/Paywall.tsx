import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Analytics } from '../services/analytics';

interface PaywallProps {
  onStartTrial: () => void;
  onRestore: () => void;
  trialDaysRemaining: number;
  price?: string;
  isFirstTime?: boolean; // True for welcome screen, false for expired
}

export const Paywall: React.FC<PaywallProps> = ({
  onStartTrial,
  onRestore,
  trialDaysRemaining,
  price = '$9.99',
  isFirstTime = false
}) => {
  const isTrialActive = trialDaysRemaining > 0;

  // Track paywall view when component mounts
  useEffect(() => {
    const variant = isFirstTime ? 'welcome' : isTrialActive ? 'upgrade' : 'expired';
    void Analytics.logPaywallView(variant, trialDaysRemaining);

    // Track trial expiration if applicable
    if (!isTrialActive && !isFirstTime) {
      void Analytics.logTrialExpired();
    }
  }, [isFirstTime, isTrialActive, trialDaysRemaining]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isFirstTime
                ? `Welcome to Your\nGratitude Journey! 🌟`
                : `Unlock Your Full\nGratitude Journey`}
            </Text>
            <Text style={styles.subtitle}>
              {isFirstTime
                ? `Start your 7-day free trial and explore all premium features`
                : `Continue building your daily gratitude practice`}
            </Text>
          </View>

          {/* Trial Info */}
          {isFirstTime ? (
            <View style={styles.trialBox}>
              <Feather name="gift" size={32} color="#4F46E5" />
              <Text style={styles.trialTitle}>
                Try Free for {trialDaysRemaining} Days
              </Text>
              <Text style={styles.trialText}>
                Explore all features risk-free. No credit card required to start!
              </Text>
            </View>
          ) : isTrialActive ? (
            <View style={styles.trialBox}>
              <Feather name="gift" size={32} color="#4F46E5" />
              <Text style={styles.trialTitle}>
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Day' : 'Days'} Left in Your Free Trial
              </Text>
              <Text style={styles.trialText}>
                Enjoying the app? Unlock lifetime access today
              </Text>
            </View>
          ) : (
            <View style={styles.trialBox}>
              <Feather name="lock" size={32} color="#4F46E5" />
              <Text style={styles.trialTitle}>Free Trial Ended</Text>
              <Text style={styles.trialText}>
                Unlock lifetime access to continue your journey
              </Text>
            </View>
          )}

          {/* Mission Statement */}
          <View style={styles.missionBox}>
            <Feather name="heart" size={24} color="#4F46E5" />
            <Text style={styles.missionText}>
              Your purchase helps us continue our mission of fostering gratitude
              and helping more people build positive daily habits.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <Feature
              icon="check-circle"
              title="Unlimited Entries"
              description="Journal as much as you want, every day"
            />
            <Feature
              icon="trending-up"
              title="Track Your Streak"
              description="Build consistency and watch your progress"
            />
            <Feature
              icon="download"
              title="Export Your Data"
              description="Keep your entries safe with CSV export"
            />
            <Feature
              icon="shield"
              title="Private & Secure"
              description="All data stored locally on your device"
            />
            <Feature
              icon="zap"
              title="Lifetime Updates"
              description="Get all future features and improvements"
            />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            {isTrialActive
              ? `Your free trial will end in ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'}. No credit card required during trial.`
              : 'Secure payment processed through Google Play or Apple App Store'
            }
          </Text>
        </ScrollView>

        {/* Fixed Bottom Buttons */}
        <View style={styles.fixedBottom}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed
            ]}
            onPress={onStartTrial}
          >
            <Text style={styles.ctaText}>
              {isFirstTime
                ? `Start Free Trial`
                : isTrialActive
                ? `Unlock Lifetime Access - ${price}`
                : `Purchase Now - ${price}`}
            </Text>
            <Text style={styles.ctaSubtext}>
              {isFirstTime
                ? `Then ${price} for lifetime access • No subscription`
                : `Pay once, own forever • No subscription`}
            </Text>
          </Pressable>

          <Pressable
            style={styles.restoreButton}
            onPress={onRestore}
          >
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

interface FeatureProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <View style={styles.feature}>
    <View style={styles.featureIcon}>
      <Feather name={icon} size={20} color="#4F46E5" />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 200, // Space for fixed buttons at bottom
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  trialBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  trialText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  features: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  missionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  missionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 12,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
  },
  ctaButton: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ctaSubtext: {
    fontSize: 12,
    color: '#374151',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  restoreText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
