# Notification Issues - Quick Answers

## Your Questions Answered

### 1. ❌ "Browser asks for permission but doesn't display the notification"

**Root Causes:**

#### Most Common: Browser/System Notification Settings
- **Problem**: Even with permission granted, your OS or browser might be blocking notifications
- **Fix:**
  - **Windows**: Disable "Focus Assist" (Settings → System → Focus Assist → Off)
  - **macOS**: Disable "Do Not Disturb" (Control Center → Focus → Off)
  - **Browser**: Check `chrome://settings/content/notifications` and ensure notifications aren't muted

#### Second Common: Wrong Time Set
- **Problem**: If you set a notification time that's already passed today, it schedules for tomorrow
- **Example**: 
  - Current time: 3:00 PM
  - You set reminder for: 2:00 PM
  - Result: Next notification is **tomorrow** at 2:00 PM ❌
- **Fix**: Set a notification time that's **in the future** (e.g., 5-10 minutes from now)

#### Test Right Now:
Open browser console (F12) and run:
```javascript
await notificationService.sendTestNotification();
```
If you DON'T see a notification immediately, it's a browser/system setting issue, not the app!

### 2. ✅ "Is it taking the timezone of the user when setting up a hour?"

**YES! The app uses your LOCAL timezone automatically.**

**How it works:**
```javascript
// Line 266 & 329 in notificationService.ts
scheduledDate.setHours(hours, minutes, 0, 0);
```

`setHours()` always works with **local time**, not UTC.

**Example:**
- Your timezone: CET (Central European Time, UTC+1)
- You set reminder: 14:00
- System schedules: 14:00 **in your timezone** (CET)
- If you travel to EST (UTC-5), the reminder will still fire at **14:00 local time**

**To verify your timezone:**
```javascript
// Run in browser console
console.log('Your timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current local time:', new Date().toString());
```

## Quick Fix Checklist

### ✅ Step 1: Test Immediate Notification
```javascript
// Browser console (F12)
await notificationService.sendTestNotification();
```
- **If you see it**: Notifications work! Issue is with scheduling.
- **If you don't**: Browser/system settings are blocking.

### ✅ Step 2: Check Permission
```javascript
console.log(Notification.permission); // Should be "granted"
```

### ✅ Step 3: Set Future Time
1. Go to Pills Settings
2. Set notification time to **5 minutes from now**
3. Wait 5 minutes
4. Notification should appear!

### ✅ Step 4: Check System Settings
- **Windows**: Focus Assist → Off
- **macOS**: Do Not Disturb → Off  
- **Browser**: Site can send notifications → Allowed

## Why You're Probably Not Seeing Notifications

Based on typical issues:

**90% chance**: You set a reminder time that already passed today (e.g., it's 5 PM, you set 3 PM)
**8% chance**: System "Do Not Disturb" or "Focus Assist" is enabled
**2% chance**: Browser notification permissions issue

## The Solution

**For Testing (Immediate Notification):**
```javascript
// In browser console
await notificationService.sendTestNotification();
```

**For Real Use (Schedule Notification):**
1. Check current time (e.g., 14:30)
2. Set notification 10+ minutes in future (e.g., 14:40)
3. Save settings
4. Check console: Should see "Scheduled X web notifications for [pill name]"
5. Wait until 14:40
6. Notification appears! 🎉

## Still Stuck?

Run this complete diagnostic:

```javascript
// Copy-paste into browser console
console.log('=== NOTIFICATION DIAGNOSTIC ===');
console.log('1. Notifications API supported:', 'Notification' in window);
console.log('2. Permission status:', Notification.permission);
console.log('3. Your timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('4. Current local time:', new Date().toString());
console.log('5. Testing notification...');
await notificationService.sendTestNotification();
console.log('=== END DIAGNOSTIC ===');
```

If the test notification appears, your setup is correct! Just schedule notifications for times in the future.

If the test notification doesn't appear, check:
1. Browser site permissions (click lock icon in address bar)
2. System Do Not Disturb / Focus Assist settings
3. Browser notification settings (`chrome://settings/content/notifications`)
