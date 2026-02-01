# 🚀 Pilliox Deployment Checklist

Use this checklist before deploying your app to production on iOS and Android.

## Pre-Deployment Setup

### 1. Update App Information

- [ ] Update `appId` in `capacitor.config.ts` to your unique identifier
  ```typescript
  appId: 'com.yourcompany.pilliox'
  ```

- [ ] Update app name in:
  - [ ] `capacitor.config.ts` (`appName: 'Pilliox'`)
  - [ ] iOS: `ios/App/App/Info.plist`
  - [ ] Android: `android/app/src/main/res/values/strings.xml`

- [ ] Update version number:
  - [ ] `package.json` (`version`)
  - [ ] iOS: `ios/App/App.xcodeproj/project.pbxproj` (CFBundleShortVersionString)
  - [ ] Android: `android/app/build.gradle` (versionName, versionCode)

### 2. Configure OAuth & Deep Links

- [ ] Set up OAuth redirect URLs in Supabase:
  - [ ] `com.yourcompany.pilliox://callback`
  - [ ] Your production website URL

- [ ] Configure Google OAuth client IDs:
  - [ ] iOS client ID (bundle ID)
  - [ ] Android client ID (package name + SHA-1)
  - [ ] Web client ID

- [ ] Test OAuth flow on both platforms

### 3. Assets & Branding

- [ ] App icon (1024x1024 for iOS, 512x512 for Android)
- [ ] Splash screens for all required sizes
- [ ] App store screenshots:
  - [ ] iPhone (6.7", 6.5", 5.5")
  - [ ] iPad Pro (12.9", 11")
  - [ ] Android (Phone, 7" tablet, 10" tablet)

### 4. Code & Build

- [ ] Remove all `console.log()` statements or add production logging
- [ ] Remove development server URL from `capacitor.config.ts`
- [ ] Test dark mode thoroughly
- [ ] Test all three languages (English, German, Polish)
- [ ] Test on various screen sizes
- [ ] Test swipe gestures and animations
- [ ] Run production build: `npm run build`

### 5. Security

- [ ] Verify no API keys are hardcoded in client code
- [ ] Check that sensitive data is not logged
- [ ] Ensure HTTPS is used for all API calls
- [ ] Test auth token expiration handling
- [ ] Review data storage (sensitive data in secure storage)

## Platform-Specific

### iOS Deployment

- [ ] Apple Developer account enrolled ($99/year)
- [ ] App registered in App Store Connect
- [ ] Provisioning profiles configured
- [ ] Code signing certificate valid
- [ ] Privacy policy URL ready
- [ ] App Store listing complete:
  - [ ] Name
  - [ ] Subtitle
  - [ ] Description
  - [ ] Keywords
  - [ ] Screenshots
  - [ ] Preview video (optional)
  - [ ] Age rating
  - [ ] Privacy policy
  - [ ] Support URL

- [ ] Build archive in Xcode (Product > Archive)
- [ ] Upload to App Store Connect
- [ ] Submit for review

**Estimated Review Time:** 1-3 days

### Android Deployment

- [ ] Google Play Developer account created ($25 one-time)
- [ ] Signing key generated and stored securely
- [ ] Build signed release AAB
- [ ] App listing in Play Console:
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] Screenshots
  - [ ] Feature graphic
  - [ ] App icon
  - [ ] Content rating
  - [ ] Privacy policy
  - [ ] Target audience

- [ ] Internal testing (optional but recommended)
- [ ] Closed testing (optional)
- [ ] Open testing / Production release

**Estimated Review Time:** Few hours to 1 day

## Testing Checklist

### Functional Testing

- [ ] User registration with email/password
- [ ] Google OAuth login
- [ ] Facebook OAuth login (if configured)
- [ ] Calendar navigation (swipe left/right)
- [ ] Add financial entry (INR amount)
- [ ] Add note to day
- [ ] Add pills count
- [ ] Color code days
- [ ] Multi-day selection
- [ ] Add tags/labels to colored ranges
- [ ] Delete entries
- [ ] Theme switching (light/dark)
- [ ] Language switching (EN/DE/PL)
- [ ] Settings modification
- [ ] Logout

### Device Testing

Test on:
- [ ] Latest iOS version
- [ ] iOS -1 version
- [ ] Latest Android version
- [ ] Android API 24 (minimum supported)
- [ ] Small screen (iPhone SE, small Android)
- [ ] Large screen (iPhone Pro Max, large Android)
- [ ] Tablet (iPad, Android tablet)

### Edge Cases

- [ ] No internet connection
- [ ] Slow internet connection
- [ ] App backgrounding and foregrounding
- [ ] Deep link from external browser
- [ ] System settings changes (theme, language)
- [ ] Low storage space
- [ ] Low memory
- [ ] Notifications (if implemented)

## Post-Deployment

### Monitoring

- [ ] Set up crash reporting (Sentry, Firebase Crashlytics)
- [ ] Monitor app store reviews
- [ ] Track user analytics (optional)
- [ ] Monitor server logs for API errors
- [ ] Check OAuth callback success rate

### User Feedback

- [ ] Set up feedback channel (email, in-app)
- [ ] Monitor App Store reviews
- [ ] Monitor Play Store reviews
- [ ] Prepare FAQ document
- [ ] Create support documentation

### Updates

- [ ] Plan update schedule
- [ ] Prepare changelog for users
- [ ] Test update process (app store, over-the-air)
- [ ] Version migration testing

## Legal & Compliance

- [ ] Privacy policy published and accessible
- [ ] Terms of service (if applicable)
- [ ] GDPR compliance (if serving EU users):
  - [ ] Data collection disclosure
  - [ ] User consent mechanisms
  - [ ] Data deletion capability
  - [ ] Cookie/tracking disclosure
- [ ] Age restrictions set appropriately
- [ ] Copyright notices

## Emergency Procedures

Document these before launch:

- [ ] How to hotfix critical bugs
- [ ] How to rollback a release
- [ ] Who to contact for server issues
- [ ] Supabase access credentials (secure location)
- [ ] App store account credentials (secure location)
- [ ] OAuth credentials location

## Final Sign-Off

- [ ] Product owner approval
- [ ] Technical review complete
- [ ] Legal review (if required)
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] Launch communication prepared

---

**Remember:** Better to delay launch and get it right than to rush and deal with bad reviews!

**Pro Tip:** Do a staged rollout (10% → 50% → 100%) on Android to catch issues early.
