# In-App Purchase Setup Guide

This guide will help you set up in-app purchases for both the App Store (iOS) and Google Play Store (Android).

## Overview

The app uses a **one-time purchase** (non-consumable) model:
- 7-day free trial (no credit card required)
- One-time payment for lifetime access
- Price: $9.99 USD (or local equivalent)

---

## Product IDs

**IMPORTANT:** These product IDs are defined in `src/gratitude/services/PurchaseManager.ts`

- **iOS:** `com.diazleonardoacl.gratitudejournal.lifetime`
- **Android:** `lifetime_access`

---

## Google Play Store Setup (Android)

### 1. Create Google Play Console Account
- Go to [Google Play Console](https://play.google.com/console)
- Pay the $25 one-time registration fee (if not already done)

### 2. Create Your App
- Create a new application
- Fill in basic app details

### 3. Set Up In-App Products

**Navigate to:** Monetize → In-app products → Create product

**Product Details:**
- **Product ID:** `lifetime_access`
- **Name:** Lifetime Access
- **Description:** Get unlimited access to all premium features of 30-Second Gratitude Journal with a one-time purchase. No subscription, just pay once and own it forever.
- **Status:** Active
- **Product Type:** One-time product (not subscription)
- **Price:** $9.99 USD

**Pricing:**
- Set default price to $9.99 USD
- Google Play will auto-convert to local currencies

**Save and activate** the product.

### 4. Update app.json for Android

The package name is already set: `com.diazleonardoacl.gratitudejournal`

---

## Apple App Store Setup (iOS)

### 1. Create Apple Developer Account
- Go to [Apple Developer](https://developer.apple.com)
- Enroll in the Apple Developer Program ($99/year)

### 2. Create App ID
- Go to Certificates, Identifiers & Profiles
- Create a new App ID with bundle identifier: `com.diazleonardoacl.gratitudejournal`
- Enable **In-App Purchase** capability

### 3. Create App in App Store Connect

**Navigate to:** [App Store Connect](https://appstoreconnect.apple.com)

- Click "My Apps" → "+" → "New App"
- **Platform:** iOS
- **Name:** 30-Second Gratitude Journal
- **Primary Language:** English
- **Bundle ID:** com.diazleonardoacl.gratitudejournal
- **SKU:** gratitude-journal-2026

### 4. Set Up In-App Purchase

**Navigate to:** App Store Connect → Your App → Features → In-App Purchases → "+"

**Product Type:** Non-Consumable

**Reference Name:** Lifetime Access

**Product ID:** `com.diazleonardoacl.gratitudejournal.lifetime`

**Pricing:**
- Price Tier: $9.99 USD (Tier 10)
- Availability: All territories

**Localization (English - U.S.):**
- **Display Name:** Lifetime Access
- **Description:** Get unlimited access to all premium features of 30-Second Gratitude Journal with a one-time purchase. Track your gratitude journey, export your entries, and build daily habits without any recurring fees.

**Review Screenshot:**
- Take a screenshot of the paywall screen from the app
- Upload it as required for Apple review

**Save** and **Submit for Review**

---

## Testing In-App Purchases

### Test on iOS (Sandbox)

1. **Create Sandbox Tester Account:**
   - Go to App Store Connect → Users and Access → Sandbox Testers
   - Add a new sandbox tester with a unique Apple ID (e.g., test@example.com)
   - **Important:** Don't use a real Apple ID

2. **Test on Device:**
   - Build the app for testing (development build or TestFlight)
   - Sign out of App Store on your device (Settings → Apple ID → Sign Out)
   - Open the app and trigger a purchase
   - Sign in with sandbox tester account when prompted
   - Test the purchase flow

3. **Verify:**
   - Purchase should complete without charging real money
   - App should unlock premium features
   - Restore purchase should work

### Test on Android (Sandbox)

1. **Add License Testers:**
   - Go to Play Console → Setup → License testing
   - Add test email addresses (gmail addresses work best)

2. **Create Internal Testing Track:**
   - Go to Testing → Internal testing
   - Create a new release
   - Upload your AAB file
   - Add yourself as a tester

3. **Test on Device:**
   - Install from internal testing link
   - Make sure you're signed in with a test email
   - Trigger a purchase
   - You'll see "[Test]" in the payment dialog
   - Complete purchase (won't charge real money)

4. **Verify:**
   - Purchase should complete
   - Premium features should unlock
   - Restore purchase should work

---

## Build Configuration

### Update eas.json (if needed)

Your `eas.json` is already configured. Just make sure the production profile is correct:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Build Commands

**For Android:**
```bash
eas build --platform android --profile production
```

**For iOS:**
```bash
eas build --platform ios --profile production
```

---

## Testing Checklist

Before submitting to stores:

- [ ] Product IDs match in code and store consoles
- [ ] Prices are set correctly in both stores
- [ ] Purchase flow works on both platforms
- [ ] Restore purchase works correctly
- [ ] App handles purchase cancellation gracefully
- [ ] App handles network errors during purchase
- [ ] Receipt validation works (if implemented)
- [ ] Trial period tracks correctly
- [ ] Premium features unlock after purchase

---

## Common Issues & Solutions

### iOS: "Cannot connect to iTunes Store"
- Make sure you're signed in with a sandbox account
- Don't use a real Apple ID for testing
- Sandbox doesn't work in Expo Go - need a development build

### Android: "Product not found"
- Make sure product is **Active** in Play Console
- Product ID must match exactly (case-sensitive)
- May take a few hours for new products to propagate

### Purchase doesn't restore
- iOS: User must use same Apple ID
- Android: User must use same Google account
- Check that `getAvailablePurchases()` is being called correctly

### Expo Go limitations
- In-app purchases **do not work** in Expo Go
- You must create a development build or production build
- Use `eas build` to create builds for testing

---

## Going Live

### Final Steps:

1. **Complete store listings:**
   - Add all required screenshots
   - Write descriptions
   - Set categories
   - Add privacy policy URL

2. **Submit for review:**
   - Google Play: Usually approved in 1-3 days
   - App Store: Usually takes 1-3 days

3. **Monitor:**
   - Check for any rejections or requests for information
   - Test purchase flow immediately after approval

---

## Revenue & Reporting

### Google Play Console
- Monetization → Earnings reports
- View sales and revenue data

### App Store Connect
- Sales and Trends
- Financial Reports
- Payments and Financial Reports

---

## Support & Refunds

### Handling Refunds:

**iOS:**
- Users request refunds directly from Apple
- You can check refund status in App Store Connect
- Your app should handle refunded purchases gracefully

**Android:**
- Users can request refunds through Play Store (48 hours automatic)
- You can also issue refunds manually in Play Console
- Monitor for refund abuse

### Customer Support:

Make sure to handle these scenarios:
- "I purchased but premium didn't unlock" → Guide to restore purchase
- "I want a refund" → Direct to store refund process
- "Why do I need to pay?" → Explain 7-day free trial and one-time payment

---

## Next Steps

1. Set up products in both stores (use product IDs from above)
2. Build the app with `eas build`
3. Test purchases in sandbox/internal testing
4. Submit to stores
5. Monitor and respond to reviews

Good luck with your launch! 🚀
