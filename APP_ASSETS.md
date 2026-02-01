# 🎨 App Assets Guide

This guide explains how to add app icons and splash screens to your Pilliox mobile app.

## App Icons

### Requirements

**iOS:**
- 1024x1024px PNG (App Store)
- No alpha channel, no transparency
- Square with no rounded corners (iOS adds them)

**Android:**
- 512x512px PNG (Play Store)
- Can include transparency
- Should include padding for different shapes

### Generating Icons

You can use tools like:
- [Icon.kitchen](https://icon.kitchen/)
- [Appicon.co](https://www.appicon.co/)
- [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)

### Manual Setup

1. **iOS:**
   - Open `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Replace icon files with your own
   - Or use Xcode: Select AppIcon > Drag your 1024x1024 image

2. **Android:**
   - Place icons in `android/app/src/main/res/`:
     - `mipmap-hdpi/` - 72x72px
     - `mipmap-mdpi/` - 48x48px
     - `mipmap-xhdpi/` - 96x96px
     - `mipmap-xxhdpi/` - 144x144px
     - `mipmap-xxxhdpi/` - 192x192px

### Using Capacitor Assets (Recommended)

Install:
```bash
npm install -g @capacitor/assets
```

Create a `resources` folder with:
- `icon.png` (1024x1024px)
- `splash.png` (2732x2732px with centered logo)

Generate:
```bash
npx capacitor-assets generate
```

## Splash Screens

### iOS Splash Screen

1. Open Xcode
2. Navigate to `ios/App/App/Assets.xcassets/Splash.imageset/`
3. Replace splash images or use Xcode to add them

### Android Splash Screen

1. Edit `android/app/src/main/res/values/styles.xml`
2. Add your splash screen configuration:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

3. Add splash image to `android/app/src/main/res/drawable/`

## App Name

### iOS

Edit `ios/App/App/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>Pilliox</string>
```

### Android

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Pilliox</string>
```

## Colors and Theming

### iOS Status Bar

Edit `capacitor.config.ts`:
```typescript
ios: {
  contentInset: 'always',
  backgroundColor: '#000000', // Your color
}
```

### Android Theme

Edit `android/app/src/main/res/values/styles.xml`:
```xml
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
    <item name="colorAccent">@color/colorAccent</item>
</style>
```

Add colors in `android/app/src/main/res/values/colors.xml`:
```xml
<resources>
    <color name="colorPrimary">#4F46E5</color>
    <color name="colorPrimaryDark">#4338CA</color>
    <color name="colorAccent">#10B981</color>
</resources>
```

## Launch Screen Configuration

To customize the launch screen behavior, edit `capacitor.config.ts`:

```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
}
```

## Quick Checklist

Before publishing:

- [ ] App icon (1024x1024 for iOS, 512x512 for Android)
- [ ] Splash screen images
- [ ] App name configured
- [ ] Bundle ID/Package name updated
- [ ] Theme colors set
- [ ] Status bar style configured
- [ ] Safe area insets tested on notched devices

---

**Pro Tip:** Test your app on multiple devices/simulators to ensure icons and splash screens look good on different screen sizes and orientations!
