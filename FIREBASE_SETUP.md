# Firebase Analytics Setup Guide

Firebase Analytics has been integrated into your app! This guide will help you complete the setup by configuring Firebase Console and adding the required configuration files.

---

## What's Been Done

✅ Installed Firebase packages (`@react-native-firebase/app`, `@react-native-firebase/analytics`)
✅ Created analytics service at `src/gratitude/services/analytics.ts`
✅ Integrated analytics tracking throughout the app:
  - App opens and user properties
  - Screen views (home, history, settings)
  - Paywall views and dismissals
  - Purchase events (initiated, completed, restored)
  - Entry events (created, edited, deleted)
  - Data exports
  - Streak milestones
  - Trial expiration
✅ Updated `app.json` with Firebase plugin

---

## What You Need to Do

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. **Project name:** `gratitude-journal` (or any name you prefer)
4. **Google Analytics:** Enable it (recommended)
5. Click **"Create project"**

---

### Step 2: Add iOS App

1. In Firebase Console, click the **iOS** icon
2. **iOS bundle ID:** `com.diazleonardoacl.gratitudejournal`
   - This must match exactly what's in your `app.json`
3. **App nickname:** Gratitude Journal iOS (optional)
4. **App Store ID:** Leave blank for now (add after app is published)
5. Click **"Register app"**

6. **Download config file:**
   - Download `GoogleService-Info.plist`
   - Save it to your project root directory:
     ```
     /Users/diazleonardo/Documents/Scripts/ACL/30-Second Gratitude Journal/GoogleService-Info.plist
     ```

7. Click **"Next"** through the remaining steps (SDK is already added via npm)
8. Click **"Continue to console"**

---

### Step 3: Add Android App

1. In Firebase Console, click the **Android** icon (or **"Add app"** → Android)
2. **Android package name:** `com.diazleonardoacl.gratitudejournal`
   - This must match exactly what's in your `app.json`
3. **App nickname:** Gratitude Journal Android (optional)
4. **Debug signing certificate SHA-1:** Leave blank for now (not needed for Analytics)
5. Click **"Register app"**

6. **Download config file:**
   - Download `google-services.json`
   - Save it to your project root directory:
     ```
     /Users/diazleonardo/Documents/Scripts/ACL/30-Second Gratitude Journal/google-services.json
     ```

7. Click **"Next"** through the remaining steps
8. Click **"Continue to console"**

---

### Step 4: Verify Configuration Files

After downloading both files, your project directory should have:

```
30-Second Gratitude Journal/
├── GoogleService-Info.plist    ← iOS config
├── google-services.json         ← Android config
├── app.json
├── src/
└── ...
```

**IMPORTANT:** These files contain configuration data (not secrets), but you may want to add them to `.gitignore` if your repository is public.

---

### Step 5: Enable Analytics in Firebase Console

1. In Firebase Console, go to **Analytics** → **Dashboard**
2. Analytics should be automatically enabled
3. You can customize data retention and other settings in **Analytics** → **Settings**

**Recommended Settings:**
- **Data retention:** 14 months (maximum for free tier)
- **Reset data on new activity:** OFF
- **Reporting identity:** Google signals and device ID

---

### Step 6: Build and Test

Now you're ready to build the app with Firebase Analytics enabled.

#### Build for Development Testing:

```bash
# iOS development build
eas build --profile development --platform ios

# Android development build
eas build --profile development --platform android
```

#### Build for Production:

```bash
# iOS production build
eas build --profile production --platform ios

# Android production build
eas build --profile production --platform android
```

---

## Events Being Tracked

Your app now tracks the following events:

### User Lifecycle
- **app_open** - When user opens the app
- **screen_view** - When user switches screens (home, history, settings)

### Conversion Funnel
- **paywall_view** - When paywall is shown (tracks variant: welcome/upgrade/expired)
- **paywall_dismiss** - When user closes paywall during trial
- **begin_checkout** - When user taps purchase button
- **purchase** - When purchase completes successfully
- **restore_purchase** - When user attempts to restore purchase
- **trial_expired** - When user's free trial ends

### User Engagement
- **entry_created** - When user creates a gratitude entry
- **entry_edited** - When user edits an existing entry
- **entry_deleted** - When user deletes an entry
- **entry_detail_viewed** - When user taps to view entry details
- **history_viewed** - When user views their history (includes entry count)
- **data_export** - When user exports their entries to CSV
- **streak_milestone** - When user reaches streak milestones (3, 7, 14, 30, 60, 90, 180, 365 days)

### User Properties
- **premium_status** - Whether user has premium access (premium/free)
- **trial_status** - Whether user's trial is active (active/expired)

---

## Privacy Considerations

**Important:** Your app is a personal journal, so privacy is critical.

✅ **What we DO track:**
- Anonymous event counts (how many entries created, viewed, etc.)
- Screen navigation patterns
- Purchase conversion funnel
- Streak milestones

❌ **What we DON'T track:**
- Entry content (gratitude text is NEVER sent to analytics)
- Personal information
- User identifiers (unless user signs in with Google/Apple)
- Exact timestamps are only used for aggregation

All data is anonymous and aggregated by Firebase. Individual user actions cannot be traced back to specific people.

---

## Viewing Analytics Data

### Firebase Console

1. Go to Firebase Console → Your Project → **Analytics**
2. **Dashboard** - Overview of user activity
3. **Events** - See all tracked events and their parameters
4. **Conversions** - Mark events as conversion goals (e.g., `purchase`)
5. **Audiences** - Create user segments (e.g., "Users in trial", "Premium users")
6. **Funnels** - Analyze conversion paths (e.g., paywall_view → begin_checkout → purchase)

### Useful Metrics to Monitor

- **Active users** - Daily/weekly/monthly active users
- **User retention** - How many users come back after 1, 7, 30 days
- **Conversion rate** - paywall_view → purchase
- **Average streak** - Track streak_milestone events
- **Premium adoption** - Users with premium_status = premium

---

## Troubleshooting

### Analytics not showing up in Firebase Console

1. **Wait 24 hours** - Analytics data can take up to 24 hours to appear
2. **Check DebugView** - In Firebase Console, enable debug mode:
   ```bash
   # iOS
   adb shell setprop debug.firebase.analytics.app com.diazleonardoacl.gratitudejournal

   # Android
   adb shell setprop debug.firebase.analytics.app com.diazleonardoacl.gratitudejournal
   ```
3. **Verify config files** - Make sure `GoogleService-Info.plist` and `google-services.json` are in the project root

### Build errors

If you get errors about Firebase during build:

1. Make sure both config files are downloaded and in the project root
2. Try clearing the cache: `npm run clean` or `expo start -c`
3. Make sure `@react-native-firebase/app` is in the plugins array in `app.json`

### Testing in Expo Go

**Firebase Analytics does NOT work in Expo Go.** You must create a development build or production build with EAS:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

---

## Next Steps

1. ✅ Download `GoogleService-Info.plist` (iOS)
2. ✅ Download `google-services.json` (Android)
3. ✅ Place both files in project root
4. ✅ Build the app with `eas build`
5. ✅ Test on a real device
6. ✅ Check Firebase Console Analytics dashboard in 24 hours

After setup is complete, you'll be able to see detailed analytics about how users interact with your app, helping you optimize the experience and increase conversion rates!

---

## Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

🚀 Happy tracking!
