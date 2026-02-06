# Pilliox Version History 📋

This file tracks all version updates to the Pilliox app. Update the version number in `/src/app/components/ProfileSettings.tsx` when making significant changes.

---

## Version 1.0.7 (Current)
**Release Date:** February 6, 2026

### Bug Fixes:
- 🐛 **Fixed Legal Page Navigation Bug**
  - Fixed issue where clicking "Back" from Terms/Privacy pages would redirect to login even when user was logged in
  - Removed early return in authentication check that prevented session detection on legal pages
  - Authentication state is now properly checked even when viewing legal pages
  - Back button now correctly navigates to calendar view for logged-in users
  - Back button correctly navigates to login page for guests

### Technical Details:
- The `initAuth` function was returning early when on legal pages (`/docs/terms` or `/docs/privacy`)
- This prevented the Supabase session check from running, leaving `accessToken` as `null`
- The back button logic checked `if (accessToken)` to determine where to navigate
- Since `accessToken` was always `null`, it always redirected to login
- Fixed by removing the early return and allowing authentication checks on all pages

---

## Version 1.0.6
**Release Date:** February 6, 2026

### Bug Fixes:
- 🐛 **Fixed Critical Import Error in ProfileSettings**
  - Fixed missing imports for React hooks (`useState`, `useEffect`)
  - Fixed missing imports for `useTranslation` from react-i18next
  - Fixed missing imports for UI components (Dialog, Button, Input, etc.)
  - Fixed missing imports for icons (User, Lock, Trash2)
  - App now loads correctly without console errors

### Technical Details:
- The ProfileSettings component was missing all its import statements
- This caused a `ReferenceError: useTranslation is not defined` error
- All required imports have been restored and verified

---

## Version 1.0.5
**Release Date:** February 6, 2026

### Configuration:
- ✅ **Manual Configuration Updates**
  - Updated `/public/_redirects` configuration file
  - Refined routing rules for production deployment

### Improvements:
- Version numbering discipline enforced
- Consistent version tracking across all changes

---

## Version 1.0.4
**Release Date:** February 6, 2026

### Features:
- ✅ **Path-Based Routing for Legal Pages**
  - Changed from hash-based URLs (`#/docs/terms`) to proper path-based URLs (`/docs/terms` and `/docs/privacy`)
  - Direct URL access now works perfectly: `https://www.pilliox.com/docs/terms` and `https://www.pilliox.com/docs/privacy`
  - Better SEO and more professional URL structure
  - Shareable links that work across all platforms

### Technical Improvements:
- Implemented proper client-side routing using History API (pushState/popState)
- Added SPA fallback configuration for Netlify (`public/_redirects`)
- Added Vercel configuration (`vercel.json`) for proper routing
- Browser back/forward buttons now work correctly with legal pages

### Deployment Requirements:
- For production deployment, ensure your hosting provider is configured to serve `index.html` for all routes
- Netlify: Uses `_redirects` file (already configured)
- Vercel: Uses `vercel.json` (already configured)
- Other hosts: Configure rewrites to serve `/index.html` for all paths

---

## Version 1.0.3
**Release Date:** February 6, 2026

### Features:
- ✅ **Improved Legal Page URLs**
  - Updated URLs from `#/terms` and `#/privacy` to cleaner paths: `#/docs/terms` and `#/docs/privacy`
  - Better organization with `/docs/` prefix for documentation pages
  - More professional and structured URL hierarchy
  - Maintains full standalone page functionality

### Technical Improvements:
- Updated hash-based routing to use `/docs/` prefix
- All navigation handlers updated to new URL structure
- Backward-compatible routing (old URLs still work during transition)

---

## Version 1.0.2
**Release Date:** February 6, 2026

### Features:
- ✅ **Standalone Legal Pages**
  - Terms of Service and Privacy Policy are now completely separate standalone pages
  - Can be accessed directly via URLs: `#/terms` and `#/privacy`
  - No login required to view legal pages
  - Shareable URLs work properly even when logged in
  - "Back" button returns to calendar if logged in, auth page if not

### Improvements:
- Enhanced hash-based routing to properly handle legal page navigation
- Better separation between authenticated and public content
- Improved user experience for legal document access

---

## Version 1.0.1
**Release Date:** February 6, 2026

### Bug Fixes:
- ✅ Fixed direct URL access for legal pages (#/terms and #/privacy)
  - Legal pages can now be accessed directly via URL without being redirected to auth
  - OAuth callback detection no longer interferes with legal page routing
  - Users can share and bookmark legal page URLs properly

### UI Improvements:
- ✅ Simplified legal page links in ProfileSettings modal
  - Changed from URL input fields with copy buttons to simple clickable links
  - Consistent styling with AuthForm legal links
  - Cleaner, more intuitive interface

---

## Version 1.0.0
**Release Date:** February 6, 2026

### Initial Release Features:
- ✅ **Authentication System**
  - Email/password login and signup
  - Google OAuth integration
  - iOS OAuth support
  - Secure token-based authentication
  - Account linking for OAuth providers

- ✅ **Calendar Functionality**
  - Monthly calendar view with swipe navigation
  - Mark days with INR financial values
  - Add notes to calendar entries
  - Pills counter for medication tracking
  - Multi-day selection with color coding
  - Tags/labels for colored day ranges

- ✅ **Theme System**
  - Light mode
  - Dark mode
  - System preference detection
  - Smooth theme transitions

- ✅ **Multi-Language Support**
  - English (default)
  - German
  - Polish
  - Language selector in login, register, and app settings

- ✅ **Profile & Settings**
  - User profile management
  - Password change functionality
  - Account deletion with confirmation
  - Profile settings modal with tabs (Profile/Security)

- ✅ **Legal Pages**
  - Terms of Service page
  - Privacy Policy page
  - Multi-language support for legal docs
  - Shareable URLs with hash routing (`#/terms`, `#/privacy`)
  - Copy-to-clipboard functionality for legal page URLs

- ✅ **Mobile Support**
  - Capacitor integration for iOS and Android
  - Mobile-optimized OAuth handling
  - PWA (Progressive Web App) support
  - Responsive design
  - Touch-optimized swipe gestures

- ✅ **Backend Infrastructure**
  - Supabase integration
  - Edge functions for server operations
  - Key-value storage
  - User data encryption
  - Secure API endpoints

---

## How to Update Version

When making significant changes to the app:

1. **Update the version number** in `/src/app/components/ProfileSettings.tsx`:
   ```typescript
   const APP_VERSION = "1.X.X";
   ```

2. **Add an entry to this file** with:
   - Version number
   - Release date
   - List of changes/features
   - Bug fixes (if any)

3. **Version Numbering Guidelines**:
   - **Major version (1.x.x)**: Major new features, breaking changes, or complete redesigns
   - **Minor version (x.1.x)**: New features, significant improvements, new functionality
   - **Patch version (x.x.1)**: Bug fixes, minor tweaks, small improvements

---

## Upcoming Features (Planned)

Ideas for future versions:
- Export calendar data
- Import calendar data
- Recurring events
- Reminders/notifications
- Data backup and restore
- More OAuth providers (Apple, Facebook, GitHub)
- Widgets for mobile
- Calendar sharing
- Multiple calendars per user

---

**Note:** Always update both the version constant in the code AND this history file to keep tracking consistent.