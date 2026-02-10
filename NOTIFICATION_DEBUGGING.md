# Notification Debugging Guide for Pilliox

## Quick Test

To quickly test if notifications are working, open the browser console and run:

```javascript
// Test notification immediately
await notificationService.sendTestNotification();
```

## Common Issues & Solutions

### Issue 1: Browser Asks for Permission but Doesn't Show Notification

**Symptoms:**
- Permission dialog appears and you click "Allow"
- No notification appears on screen
- Console shows permission is "granted"

**Possible Causes & Solutions:**

#### A. Browser "Do Not Disturb" / Focus Mode
- **Windows**: Check if Focus Assist is enabled (Settings → System → Focus Assist)
- **macOS**: Check if Do Not Disturb is enabled (System Preferences → Notifications)
- **Chrome**: Check if site notifications are muted in browser settings

#### B. Site-Level Permissions
1. Click the lock icon next to the URL
2. Check if "Notifications" is set to "Allow"
3. If blocked, change to "Allow" and refresh the page

#### C. Browser Notification Settings
**Chrome/Edge:**
1. Go to `chrome://settings/content/notifications`
2. Check if the site is in the "Allowed" list
3. Check if "Sites can ask to send notifications" is enabled

**Firefox:**
1. Go to `about:preferences#privacy`
2. Scroll to "Permissions" → "Notifications" → "Settings"
3. Check if the site is allowed

**Safari:**
1. Safari → Preferences → Websites → Notifications
2. Check if the site is set to "Allow"

### Issue 2: Timezone Not Working Correctly

**How It Works:**
- The app uses **local timezone** automatically
- When you set a notification time (e.g., 14:00), it schedules for 14:00 in YOUR timezone
- Uses JavaScript `Date.setHours()` which respects local timezone

**To Verify:**
1. Open browser console
2. Check scheduled notifications:
```javascript
const pending = await notificationService.getPendingNotifications();
console.log('Scheduled notifications:', pending);
pending.forEach(n => {
  console.log('Scheduled for:', new Date(n.schedule.at));
});
```

3. Check your system timezone:
```javascript
console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current time:', new Date().toString());
```

### Issue 3: Notifications Schedule But Don't Fire

**Debugging Steps:**

1. **Check if notifications are scheduled:**
```javascript
const pending = await notificationService.getPendingNotifications();
console.log(`${pending.length} notifications scheduled`);
console.log(pending);
```

2. **Check localStorage:**
```javascript
const stored = localStorage.getItem('pilliox_scheduled_notifications');
console.log('Stored notifications:', JSON.parse(stored));
```

3. **Verify notification time hasn't passed:**
```javascript
const now = new Date();
console.log('Current time:', now);
console.log('Notification time set for:', '14:00'); // your time
```

If the time you set has already passed today, the notification will be scheduled for tomorrow!

**Example:**
- Current time: 15:00 (3 PM)
- You set notification for: 14:00 (2 PM)
- Result: Next notification will be **tomorrow** at 14:00

**Solution:**
Set a notification time that's in the future (e.g., 5 minutes from now) to test immediately.

### Issue 4: Page Reload Clears Notifications

**Web Limitation:**
- Web notifications use `setTimeout` which is cleared on page reload
- This is different from mobile apps where notifications persist in the OS

**Current Solution:**
- Notifications are saved to `localStorage`
- When pills are synced, notifications are rescheduled

**To Verify After Reload:**
1. Reload the page
2. Open Pills Settings
3. Check if notifications are still enabled
4. System will automatically reschedule them

## Testing Checklist

### ✅ Quick Verification

1. **Test immediate notification:**
   - Open browser console (F12)
   - Run: `await notificationService.sendTestNotification()`
   - You should see a test notification immediately

2. **Check permission status:**
```javascript
const status = await notificationService.checkPermissions();
console.log('Permission status:', status.display); // Should be "granted"
```

3. **Check if service is initialized:**
```javascript
console.log('Notification permission:', Notification.permission);
console.log('Notification API available:', 'Notification' in window);
```

### ✅ Schedule Test for Near Future

1. Go to Pills Settings
2. Create or edit a medication
3. Enable notifications
4. Set time to **2-3 minutes from now**
5. Save settings
6. Check console for: `"Scheduled X web notifications for [pill name]"`
7. Wait 2-3 minutes
8. Notification should appear!

## Console Logging

When notifications are working correctly, you should see:

```
Initializing notification service for web platform
Web Notifications API available
Notification service initialized successfully
Requesting notification permissions...
Permission result (web): granted
Scheduled 30 web notifications for Aspirin
```

When a notification fires:

```
Showing web notification for Aspirin (ID: 123456)
Web notification created successfully
```

## Browser Compatibility

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 88+ | ✅ | Full support |
| Firefox 92+ | ✅ | Full support |
| Edge 88+ | ✅ | Full support |
| Safari 16+ | ✅ | macOS only, iOS Safari has limitations |
| Opera 74+ | ✅ | Full support |

## Advanced Debugging

### Check Scheduled Timeouts

```javascript
// This should show your scheduled notifications
console.log('Service instance:', notificationService);
```

### Force Reschedule All Notifications

```javascript
// Get your pills from settings
const pills = [/* your pill settings */];
await notificationService.syncAllNotifications(pills);
```

### Clear All Notifications

```javascript
await notificationService.cancelAllNotifications();
console.log('All notifications cancelled');
```

### Check Browser Console for Errors

Look for errors containing:
- "Notification"
- "permission"
- "setTimeout"
- "localStorage"

## Still Not Working?

1. **Try incognito/private window** - This rules out extension interference
2. **Try different browser** - Confirms if it's browser-specific
3. **Check browser version** - Update to latest version
4. **Clear site data:**
   - F12 → Application tab → Clear site data
   - Refresh and try again
5. **Check console for errors** - Share any error messages

## FAQ

**Q: Why do I need to set a time in the future to see a notification?**
A: Web notifications are scheduled using `setTimeout`. If the time has passed today, it schedules for the next occurrence (tomorrow, or based on frequency).

**Q: Do notifications work when the browser is closed?**
A: No, web notifications require the browser/tab to be open. This is a web platform limitation. Mobile apps can show notifications when closed.

**Q: Can I test with a notification 10 seconds from now?**
A: Currently, the UI only allows setting hours/minutes. For testing, set a time 1-2 minutes in the future.

**Q: Why do notifications disappear after page reload?**
A: `setTimeout` is cleared on reload. The app reschedules notifications automatically when you sync pill settings or when the app initializes.

## Support

If you've tried all the above and notifications still don't work:

1. Note your browser name and version
2. Check browser console for error messages
3. Run the test notification command and note the results
4. Provide this information for further assistance
