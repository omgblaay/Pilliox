# 📱 Pilliox - Calendar & Medication Tracker

A beautiful, modern mobile calendar app for iOS and Android built with React, Capacitor, and Supabase. Track your finances (INR), medications, and daily notes with color coding, tags, and multi-language support.

## ✨ Features

- 📅 **Intuitive Calendar** - Swipe between months with smooth animations
- 💊 **Medication Tracking** - Track daily pill counts
- 💰 **Financial Tracking** - Add INR amounts to any day
- 📝 **Daily Notes** - Add detailed notes for each day
- 🎨 **Color Coding** - Mark day ranges with colors and tags
- 🌍 **Multi-Language** - English, German, and Polish support
- 🌓 **Dark Mode** - Beautiful light and dark themes
- 🔐 **Secure Auth** - Email/password and OAuth (Google, Facebook)
- 📱 **Mobile First** - Native iOS and Android apps
- ☁️ **Cloud Sync** - Your data syncs across devices via Supabase

## 🚀 Quick Start

### For Web Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### For Mobile Development

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Add mobile platforms (one-time setup)
npm run cap:add:android
npm run cap:add:ios

# Build and sync to mobile
npm run build:mobile

# Open in native IDE
npm run cap:open:android  # For Android Studio
npm run cap:open:ios      # For Xcode
```

## 📚 Documentation

- **[Mobile Setup Guide](./MOBILE_SETUP.md)** - Complete guide for iOS and Android setup
- **[App Assets Guide](./APP_ASSETS.md)** - How to add icons and splash screens
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist for app stores

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4
- **Mobile:** Capacitor 8
- **Backend:** Supabase (Auth, Database, Storage)
- **Animation:** Motion (Framer Motion)
- **i18n:** i18next, react-i18next
- **Date Utils:** date-fns
- **UI Components:** Radix UI, Material UI

## 📱 Supported Platforms

- iOS 13.0+
- Android API 24+ (Android 7.0+)
- Web browsers (Chrome, Safari, Firefox, Edge)

## 🔧 Configuration

### App ID

Update `capacitor.config.ts` with your unique app ID:

```typescript
appId: 'com.yourcompany.pilliox'
```

### OAuth Setup

1. Configure OAuth providers in [Supabase Dashboard](https://supabase.com)
2. Set up redirect URLs:
   - `com.yourcompany.pilliox://callback`
   - `https://yourdomain.com`

3. For Google OAuth on mobile:
   - Add iOS client ID in Google Cloud Console
   - Add Android client ID with SHA-1 fingerprint

See [Mobile Setup Guide](./MOBILE_SETUP.md) for detailed instructions.

## 🎯 Project Structure

```
pilliox/
├── src/
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Main app component
│   ├── i18n/               # Internationalization
│   │   ├── locales/        # Translation files (en, de, pl)
│   │   └── config.ts       # i18n configuration
│   ├── styles/             # Global styles
│   └── utils/              # Utility functions
├── supabase/
│   └── functions/          # Edge functions
├── android/                # Android native project (generated)
├── ios/                    # iOS native project (generated)
├── capacitor.config.ts     # Capacitor configuration
└── index.html              # HTML entry point
```

## 🌐 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run cap:add:android` | Add Android platform |
| `npm run cap:add:ios` | Add iOS platform |
| `npm run cap:sync` | Sync web assets to native |
| `npm run cap:open:android` | Open in Android Studio |
| `npm run cap:open:ios` | Open in Xcode |
| `npm run build:mobile` | Build web + sync to native |

## 🔐 Environment Variables

Supabase credentials are stored in:
- `/utils/supabase/info.tsx` - Project ID and keys

**Important:** Keep your service role key secure and never expose it in client code!

## 🧪 Testing

Test the app on:
- Various screen sizes (phones, tablets)
- Both light and dark modes
- All three languages
- iOS and Android devices
- Slow network conditions

## 📦 Building for Production

### Android

```bash
npm run build:mobile
npm run cap:open:android
```

In Android Studio:
- Build > Generate Signed Bundle / APK
- Follow wizard to create release build

### iOS

```bash
npm run build:mobile
npm run cap:open:ios
```

In Xcode:
- Product > Archive
- Distribute App to App Store or TestFlight

See [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) for complete guide.

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules
npm install
```

### OAuth not working on mobile
- Verify redirect URLs in Supabase
- Check OAuth client IDs are configured correctly
- Ensure deep link scheme matches capacitor.config.ts

### Build fails
- Update Android Studio and Xcode to latest versions
- Clean build folders and rebuild
- Check [Mobile Setup Guide](./MOBILE_SETUP.md) troubleshooting section

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Icons from [Lucide](https://lucide.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Design inspired by Revolut and iOS

---

**Made with ❤️ using Figma Make**

For questions or support, please refer to the documentation guides or create an issue.
