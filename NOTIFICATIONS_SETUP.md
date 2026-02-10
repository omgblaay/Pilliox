# Pilliox Notification System

This document describes the notification system implementation for medication reminders in the Pilliox mobile application.

## Overview

The notification system allows users to set up automatic reminders for their medications with customizable time and frequency settings. The system is built using **Capacitor Local Notifications** for mobile devices and **Web Notifications API** for browsers, providing a unified experience across all platforms.

## Platform Support

### Mobile (iOS/Android)
- Uses **Capacitor Local Notifications** plugin
- Native notification delivery through device OS
- Supports advanced features like sound and vibration

### Web (Browser)
- Uses **Web Notifications API**
- Shows browser notifications when app is open or in background
- Requires user permission grant
- Displays a friendly banner asking users to enable notifications

## Architecture

### Components

1. **Notification Service** (`/src/app/services/notificationService.ts`)
   - Singleton service that manages all notification operations
   - Handles device permissions
   - Schedules and cancels notifications
   - Provides centralized notification management

2. **Notifications Hook** (`/src/app/hooks/useNotifications.ts`)
   - React hook for easy integration with components
   - Manages notification state and permissions
   - Provides convenient methods for notification operations

3. **Pills Settings Integration** (`/src/app/components/PillsSettings.tsx`)
   - UI for configuring notification preferences per medication
   - Automatically syncs notifications when settings are saved

## Features

### 1. Device Permissions Management
- Request notification permissions from the user
- Check current permission status
- Handle permission denial gracefully

### 2. Notification Scheduling
- Schedule notifications for individual medications
- Support for different frequencies:
  - Daily
  - Every 2 days
  - Every 3 days
- Customizable reminder time (HH:mm format)
- Automatically schedules up to 30 future notifications

### 3. Notification Synchronization
- Sync notifications when medication settings change
- Remove orphaned notifications (for deleted medications)
- Update existing notifications when settings are modified

### 4. Notification Channels (Android)
- Creates dedicated notification channel for medication reminders
- Configurable sound and vibration settings
- High importance for visibility

## Usage

### Basic Setup

The notification service is automatically initialized when using the `useNotifications` hook:

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { 
    permissions, 
    syncNotifications,
    requestPermissions 
  } = useNotifications();

  // Check if permissions are granted
  if (!permissions.granted) {
    // Request permissions
    await requestPermissions();
  }
}
```

### Scheduling Notifications for a Medication

```typescript
import { notificationService } from '../services/notificationService';

// Schedule notifications for a single medication
await notificationService.schedulePillNotifications(pillSettings);
```

### Syncing All Notifications

```typescript
// Sync notifications for all medications
await syncNotifications(pillsArray);
```

### Canceling Notifications

```typescript
// Cancel notifications for a specific medication
await notificationService.cancelPillNotifications(pillId);

// Cancel all notifications
await notificationService.cancelAllNotifications();
```

## Notification Content

### For Pills (type: "pills")
- **Title**: `💊 [Medication Name]`
- **Body**: `Time to take [X] pill(s)`

### For Values (type: "value")
- **Title**: `💊 [Medication Name]`
- **Body**: `Time to record your [Medication Name] value`

## Configuration Options

### Per Medication Settings

Each medication can have the following notification settings:

```typescript
interface PillSetting {
  notificationsEnabled?: boolean;        // Enable/disable notifications
  notificationTime?: string;             // Time in HH:mm format (e.g., "09:00")
  notificationFrequency?: "daily" | "every2days" | "every3days";
}
```

### Service Configuration

Notification channel settings (in `notificationService.ts`):

```typescript
private readonly NOTIFICATION_CHANNEL = {
  id: 'pilliox-medication-reminders',
  name: 'Medication Reminders',
  description: 'Reminders for your medication schedule',
  importance: 5,
  sound: 'default',
  vibration: true,
};
```

## Mobile Platform Integration

### iOS
- Requires user permission for notifications
- Permissions must be requested before scheduling
- Notifications appear in the system notification center

### Android
- Creates a dedicated notification channel
- Supports custom sound and vibration
- High importance ensures visibility

## Web Browser Support

### Browser Notifications
The system uses the standard **Web Notifications API** for browsers:

- **Permission Request**: Users see a friendly banner asking to enable notifications
- **Scheduling**: Uses `setTimeout` to schedule notifications at specified times
- **Persistence**: Scheduled notifications are saved to `localStorage` for page reloads
- **Delivery**: Notifications appear even when the tab is in background (if browser supports)
- **Clicking**: Clicking a notification brings the app into focus

### Browser Compatibility
Web notifications work in modern browsers:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari 16+ (Desktop & Mobile)
- ⚠️ Safari < 16: Limited support
- ❌ Internet Explorer: Not supported

### Permission Banner Component
The `NotificationPermissionBanner` component:
- Only shows on web platform (not mobile apps)
- Appears when notifications are not enabled
- Can be dismissed by user (stored in localStorage)
- Styled to match app design with purple gradient

### Web Notification Features
```typescript
// Web notifications include:
- Title with emoji (💊 Medication Name)
- Body text with dosage/action
- App icon as notification icon
- Click to focus app window
- Vibration support (if device supports)
```

### Limitations of Web Notifications
1. **No Background Scheduling**: Unlike mobile, web notifications require the page to be open (or service worker)
2. **Browser Permissions**: Users must explicitly grant permission
3. **Limited to 30 Notifications**: To avoid excessive setTimeout calls
4. **Page Reload**: Notifications need to be re-scheduled after page reload (handled automatically)

## Testing

### Testing Notifications in Development

1. **Web Browser**: Local notifications are not supported in web browsers. The service will initialize but notifications won't be delivered.

2. **Mobile Devices/Emulators**:
   ```bash
   # Build and sync with Capacitor
   npm run build:mobile
   
   # Open in Android Studio
   npm run cap:open:android
   
   # Or open in Xcode
   npm run cap:open:ios
   ```

3. **Test Permissions**:
   - First time opening the app, permissions will be requested
   - Check permission status in notification settings

4. **Test Scheduling**:
   - Add a medication with notifications enabled
   - Set a notification time a few minutes in the future
   - Save settings and wait for notification

### Debugging

Enable detailed logging by checking console output:

```typescript
// The service logs all major operations
console.log('Scheduled X notifications for [Medication Name]');
console.log('Permission result:', result);
console.log('Syncing notifications for X medications...');
```

## Error Handling

The notification system includes comprehensive error handling:

1. **Permission Denied**: Returns `false` from `ensurePermissions()`, allowing UI to handle gracefully
2. **Scheduling Failures**: Catches and logs errors with detailed context
3. **Invalid Data**: Validates notification settings before scheduling

## Localization

Notification settings UI is fully localized in 3 languages:

- **Polish (pl)**: Powiadomienia, Godzina przypomnienia, Częstotliwość, etc.
- **German (de)**: Benachrichtigungen, Erinnerungszeit, Häufigkeit, etc.
- **English (en)**: Notifications, Reminder Time, Frequency, etc.

## Future Enhancements

Potential improvements for the notification system:

1. **Custom Notification Sounds**: Allow users to select custom sounds per medication
2. **Snooze Functionality**: Add ability to snooze reminders
3. **Notification Actions**: Quick actions like "Mark as taken" from notification
4. **Multiple Daily Reminders**: Support for medications taken multiple times per day
5. **Smart Scheduling**: Adjust schedules based on user's medication-taking patterns
6. **Notification History**: Track which notifications were delivered and acted upon

## Troubleshooting

### Notifications Not Appearing

1. **Check Permissions**:
   - Verify notification permissions are granted in device settings
   - Use `checkPermissions()` to verify programmatically

2. **Verify Scheduling**:
   - Check console logs for "Scheduled X notifications"
   - Use `getPendingNotifications()` to see scheduled notifications

3. **Time Zone Issues**:
   - Notifications are scheduled in local device time
   - Verify the notification time is in the future

4. **Platform Limitations**:
   - iOS limits the number of scheduled notifications (64 total)
   - Android has no such limit but respects battery optimization settings

### Permissions Not Working

1. **iOS**: Check Info.plist includes notification permission descriptions
2. **Android**: Verify notification channel is created successfully
3. **Both**: Ensure app is not in battery optimization mode

## Related Files

- `/src/app/services/notificationService.ts` - Core notification service
- `/src/app/hooks/useNotifications.ts` - React hook for notifications
- `/src/app/components/PillsSettings.tsx` - UI for medication settings
- `/src/i18n/locales/*.json` - Localization files with notification strings
- `/package.json` - Capacitor Local Notifications plugin dependency

## API Reference

See inline TypeScript documentation in:
- `notificationService.ts` for service methods
- `useNotifications.ts` for hook methods
- `PillsSettings.tsx` for component integration

---

**Last Updated**: February 9, 2026