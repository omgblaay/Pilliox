import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pilliox.app',
  appName: 'Pilliox',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Browser: {
      windowName: '_self',
      presentationStyle: 'fullscreen',
    },
    Preferences: {
      // Enable secure storage for auth tokens
    },
  },
  // Deep linking configuration for OAuth
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
