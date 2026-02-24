# Pilliox - Medical Tracker App

Mobile-first medical tracking application for INR blood tests, medications, and health monitoring with multi-language support (German/Polish/English).

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Capacitor** for native mobile (iOS/Android)
- **Supabase** for authentication and backend
- **Stripe** for subscriptions
- **i18next** for internationalization

## Prerequisites

- Node.js 18+ (or pnpm/yarn)
- For mobile development:
  - Android: Android Studio
  - iOS: Xcode (macOS only)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pilliox
npm install
```

### 2. Environment Variables

The following environment variables are already configured in Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

### 3. Development

#### Web Development
```bash
npm run dev
```
Open http://localhost:5173

#### Mobile Development (Android)

```bash
# Build the React app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then run the app from Android Studio.

#### Mobile Development (iOS)

```bash
# Build the React app
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then run the app from Xcode.

### 4. Common Issues

#### Tailwind CSS not loading

If Tailwind styles don't appear after cloning:

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf dist
npm install
npm run build
```

#### React Router errors

Make sure all imports use `react-router` NOT `react-router-dom`:

```typescript
// ✅ Correct
import { useNavigate } from 'react-router';

// ❌ Wrong
import { useNavigate } from 'react-router-dom';
```

#### Android build issues

```bash
# Clear and rebuild Android
rm -rf android
npm run build
npx cap add android
npx cap open android
```

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API services
│   ├── i18n/               # Translations
│   │   ├── config.ts
│   │   └── locales/        # en, de, pl translations
│   ├── styles/
│   │   ├── index.css       # Main CSS entry
│   │   ├── tailwind.css    # Tailwind config
│   │   ├── theme.css       # Theme tokens
│   │   └── fonts.css       # Font imports
│   └── main.tsx            # App entry point
├── supabase/
│   └── functions/
│       └── server/         # Edge functions
├── android/                # Android app (generated)
├── ios/                    # iOS app (generated)
└── capacitor.config.ts     # Capacitor config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build:mobile` - Build and sync to mobile platforms
- `npx cap sync` - Sync web assets to mobile
- `npx cap open android` - Open Android Studio
- `npx cap open ios` - Open Xcode

## Features

- ✅ Google/iOS OAuth + Email/Password authentication
- ✅ Multi-language support (DE/PL/EN)
- ✅ INR blood test tracking
- ✅ Medication management with pill counter
- ✅ Multi-day color-coded calendar
- ✅ Stripe subscription (€2.99/month with 3-day trial)
- ✅ GDPR-compliant cookie banner
- ✅ Dark mode support
- ✅ PWA capabilities
- ✅ Terms of Service & Privacy Policy pages

## License

Proprietary
