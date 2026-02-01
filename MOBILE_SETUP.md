# 📱 Pilliox Mobile Setup Guide

This guide will help you build and deploy the Pilliox calendar app to iOS and Android devices.

## Prerequisites

### For Both Platforms
- Node.js (v16 or higher)
- npm or pnpm
- A Mac computer (required for iOS development)

### For Android
- [Android Studio](https://developer.android.com/studio)
- Android SDK (API level 22 or higher)
- Java Development Kit (JDK) 17

### For iOS
- Xcode 14 or higher
- CocoaPods (`sudo gem install cocoapods`)
- An Apple Developer account (for device testing and App Store deployment)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Build the Web App

```bash
npm run build
```

### 3. Add Mobile Platforms

#### Add Android
```bash
npm run cap:add:android
```

#### Add iOS
```bash
npm run cap:add:ios
```

### 4. Sync Web Assets to Native Projects

After making changes to your web code, always sync:

```bash
npm run build:mobile
```

This command builds the web app and syncs it to both iOS and Android.

## 📱 Running on Devices

### Android

1. **Open Android Studio:**
   ```bash
   npm run cap:open:android
   ```

2. **Connect your Android device** via USB (with USB debugging enabled) or use an emulator

3. **Run the app:**
   - Click the "Run" button (green play icon) in Android Studio
   - Select your device from the dropdown
   - Wait for the app to build and install

### iOS

1. **Open Xcode:**
   ```bash
   npm run cap:open:ios
   ```

2. **Select your team:**
   - In Xcode, select the "Pilliox" project in the navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer team

3. **Connect your iPhone/iPad** via USB or use the iOS Simulator

4. **Run the app:**
   - Select your device from the device dropdown
   - Click the "Run" button (play icon)
   - The app will build and launch on your device

## 🔧 Configuration

### App Information

The app configuration is in `capacitor.config.ts`:

```typescript
{
  appId: 'com.pilliox.app',
  appName: 'Pilliox',
  webDir: 'dist',
}
```

**Important:** Before publishing, update the `appId` to your own unique identifier (e.g., `com.yourcompany.pilliox`).

### OAuth Setup for Mobile

For Google OAuth to work on mobile, you need to:

1. **Google Cloud Console:**
   - Go to your [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Navigate to "Credentials"
   - Add OAuth 2.0 Client IDs for:
     - **iOS**: Use your bundle ID (e.g., `com.pilliox.app`)
     - **Android**: Use your package name and SHA-1 certificate fingerprint

2. **Get Android SHA-1:**
   ```bash
   cd android
   ./gradlew signingReport
   ```

3. **Update Supabase:**
   - Go to your Supabase project settings
   - Navigate to Authentication > URL Configuration
   - Add your deep link URL: `pilliox://`
   - Add redirect URLs:
     - `com.pilliox.app://callback`
     - `https://yourdomain.com`

### Deep Linking

The app is configured to handle OAuth callbacks via deep links. The scheme is `pilliox://`.

To customize this, update `capacitor.config.ts` and add intent filters to native projects.

## 📦 Building for Production

### Android APK/Bundle

1. Open Android Studio (`npm run cap:open:android`)
2. Build > Generate Signed Bundle / APK
3. Follow the wizard to create a keystore or use an existing one
4. Select "release" build type
5. The APK/AAB will be in `android/app/build/outputs/`

### iOS Archive

1. Open Xcode (`npm run cap:open:ios`)
2. Product > Archive
3. Once the archive is complete, click "Distribute App"
4. Choose your distribution method (App Store, Ad Hoc, etc.)
5. Follow the wizard to export or upload

## 🔄 Development Workflow

1. **Make changes to web code** (React components, styles, etc.)
2. **Build and sync:**
   ```bash
   npm run build:mobile
   ```
3. **Reload the app** on your device (or rebuild from Xcode/Android Studio)

### Live Reload (Optional)

For faster development, you can use live reload:

1. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_LOCAL_IP:5173',
     cleartext: true
   }
   ```

2. Start your dev server:
   ```bash
   npm run dev
   ```

3. Run the app on your device - it will load from your dev server

**Remember:** Remove the `server.url` before building for production!

## 🐛 Troubleshooting

### Android

**Issue:** "SDK location not found"
- Open Android Studio > File > Project Structure
- Set Android SDK location

**Issue:** Build fails with Gradle errors
- Update Android Studio and SDK tools
- Sync Gradle files: File > Sync Project with Gradle Files

### iOS

**Issue:** "Code signing error"
- Select your Apple Developer team in Xcode
- Ensure your device is registered in your Apple Developer account

**Issue:** CocoaPods errors
```bash
cd ios/App
pod install
```

### OAuth Not Working

**Issue:** Google login doesn't redirect back to app
- Verify OAuth client IDs are configured correctly
- Check Supabase redirect URLs include your deep link scheme
- Ensure `capacitor.config.ts` has correct schemes

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## 🎯 Publishing

### Google Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Build a signed release AAB
3. Create a new app in Play Console
4. Upload your AAB
5. Complete store listing, pricing, and distribution settings
6. Submit for review

### Apple App Store

1. Enroll in Apple Developer Program ($99/year)
2. Create an App Store Connect record
3. Archive your app in Xcode
4. Upload to App Store Connect
5. Complete app metadata, screenshots, and privacy policy
6. Submit for review

---

**Need help?** Check the [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor/) or [GitHub Issues](https://github.com/ionic-team/capacitor/issues).
