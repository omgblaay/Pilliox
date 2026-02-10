# Changelog

All notable changes to the Pilliox app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-02-09

### Added
- **Web Notifications Support**: Full browser notification support for web users
  - Web Notifications API integration for medication reminders
  - Automatic platform detection (web vs mobile)
  - Smart scheduling using setTimeout for up to 30 future notifications
  - localStorage persistence for scheduled notifications across page reloads
  - NotificationPermissionBanner component for web users
  - Unified API across mobile and web platforms
  - Click-to-focus functionality for web notifications

### Changed
- Enhanced `notificationService.ts` to support both Capacitor (mobile) and Web Notifications API (browser)
- Improved cross-platform compatibility with automatic platform detection
- Updated notification permission flow for better UX on web
- Updated app version from 1.4.1 to 1.5.0 in all components

### Documentation
- Updated `NOTIFICATIONS_SETUP.md` with web platform details
- Added `WEB_NOTIFICATIONS_IMPLEMENTATION.md` with comprehensive implementation guide
- Added `CHANGELOG.md` to track version history
- Added browser compatibility matrix
- Added troubleshooting section for web notifications

### Localization
- Added notification banner translations for Polish (pl)
  - "Włącz powiadomienia o lekach"
  - Banner description and action buttons
- Added notification banner translations for German (de)
  - "Medikamenten-Erinnerungen aktivieren"
  - Banner description and action buttons
- Added notification banner translations for English (en)
  - "Enable Medication Reminders"
  - Banner description and action buttons

### Technical
- No new dependencies required (uses existing `@capacitor/core` v8.0.2)
- Backward compatible with existing mobile implementations
- Web notifications require HTTPS (or localhost for development)
- Supports Chrome, Firefox, Edge, and Safari 16+

### UI/UX Improvements
- Non-intrusive permission banner with purple gradient design
- Dismissible banner (preference saved to localStorage)
- Auto-dismiss on permission grant
- Clear visual feedback during permission request
- Consistent styling with Revolut/iOS-inspired design

## [1.4.1] - Previous Version

### Features
- Complete notification system for mobile devices
- Medication reminders with customizable time and frequency
- Support for daily, every 2 days, and every 3 days schedules
- Integration with Pills Settings component
- Multi-language support (Polish, German, English)
- Subscription system with Stripe integration
- 3-day free trial with €2.99/month subscription
- Terms of Service and Privacy Policy pages
- Google and Apple social login
- Email/password authentication
- Secure medical data storage per user
- Multi-day date range selection with color coding
- Calendar view with pill tracking
- INR and blood test value tracking
- Clean, minimalist Revolut/iOS-inspired design
- Mobile-first responsive layout
- Smooth animations and transitions

---

## Version History Summary

- **1.5.0** - Web notifications support
- **1.4.1** - Complete mobile notification system
- **1.4.0** - Subscription system implementation
- **1.3.0** - Authentication system
- **1.2.0** - Multi-language support
- **1.1.0** - Calendar and medication tracking
- **1.0.0** - Initial release

---

**Note**: Version numbers follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality (backward compatible)
- PATCH version for backward compatible bug fixes