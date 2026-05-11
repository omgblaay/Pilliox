/**
 * Notification Service for Pilliox
 * Handles device permissions, scheduling, and managing local notifications
 * Supports both mobile (Capacitor) and web (Browser Notifications API)
 */

import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  ScheduleResult,
  PendingResult,
  ActionPerformed,
  LocalNotificationSchema,
  Channel,
} from '@capacitor/local-notifications';
import { PillSetting } from '../components/PillsSettings';
import { diffCalendarDays } from '../constants/medicationOptions';

export interface NotificationPermissionStatus {
  display: 'granted' | 'denied' | 'prompt';
}

interface ScheduledWebNotification {
  id: number;
  pillId: string;
  scheduledTime: Date;
  timeoutId: number;
}

interface StoredWebNotification {
  id: number;
  pillId: string;
  title: string;
  body: string;
  scheduledTime: string;
}

interface MedicationReminderTime {
  time: string;
  dose: number;
  unit?: string;
}

// Max safe value for setTimeout (32-bit signed int). Delays beyond this wrap to 0 and fire immediately.
const MAX_TIMEOUT_MS = 2_147_483_647;

class NotificationService {
  private initialized = false;
  private isNativePlatform = false;
  private scheduledWebNotifications: ScheduledWebNotification[] = [];
  private readonly NOTIFICATION_CHANNEL = {
    id: 'pilliox-medication-reminders',
    name: 'Medication Reminders',
    description: 'Reminders for your medication schedule',
    importance: 5,
    sound: 'default',
    vibration: true,
  };

  /**
   * Check if running on native platform (iOS/Android)
   */
  private checkPlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize the notification service
   * Sets up notification channels and listeners
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.isNativePlatform = this.checkPlatform();

      if (this.isNativePlatform) {
        // Mobile: Use Capacitor Local Notifications
        await this.createChannel();
        await this.setupListeners();
      } else {
        // Web: Check if Notifications API is supported
        if (!('Notification' in window)) {
          throw new Error('Browser does not support notifications');
        }
        // Restore any notifications that were scheduled before a page reload
        if (Notification.permission === 'granted') {
          this.loadWebNotificationsFromStorage();
        }
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Notification initialization error: ${error}`);
    }
  }

  /**
   * Create notification channel for Android (Capacitor only)
   */
  private async createChannel(): Promise<void> {
    try {
      await LocalNotifications.createChannel(this.NOTIFICATION_CHANNEL as Channel);
    } catch (error) {
      // Don't throw - channel creation might fail on iOS (where it's not needed)
    }
  }

  /**
   * Set up notification event listeners (Capacitor only)
   */
  private async setupListeners(): Promise<void> {
    // Listen for notification actions (when user taps notification)
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification: ActionPerformed) => {
        this.handleNotificationTap(notification);
      }
    );

    // Listen for notification received events
    await LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        // Notification received
      }
    );
  }

  /**
   * Handle notification tap event
   */
  private handleNotificationTap(action: ActionPerformed): void {
    // TODO: Navigate to calendar view or specific medication
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (this.isNativePlatform) {
        // Mobile: Use Capacitor
        const result = await LocalNotifications.requestPermissions();
        
        return {
          display: result.display as 'granted' | 'denied' | 'prompt',
        };
      } else {
        // Web: Use Browser Notifications API
        const permission = await Notification.requestPermission();
        
        return {
          display: permission as 'granted' | 'denied' | 'default' === 'default' 
            ? 'prompt' 
            : permission as 'granted' | 'denied',
        };
      }
    } catch (error) {
      throw new Error(`Permission request error: ${error}`);
    }
  }

  /**
   * Check current notification permission status
   */
  async checkPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (this.isNativePlatform) {
        // Mobile: Use Capacitor
        const result = await LocalNotifications.checkPermissions();
        return {
          display: result.display as 'granted' | 'denied' | 'prompt',
        };
      } else {
        // Web: Check Browser Notification permission
        if (!('Notification' in window)) {
          return { display: 'denied' };
        }
        
        const permission = Notification.permission;
        return {
          display: permission === 'default' ? 'prompt' : permission as 'granted' | 'denied',
        };
      }
    } catch (error) {
      throw new Error(`Permission check error: ${error}`);
    }
  }

  /**
   * Ensure permissions are granted, request if needed
   */
  async ensurePermissions(): Promise<boolean> {
    const status = await this.checkPermissions();
    
    if (status.display === 'granted') {
      return true;
    }

    if (status.display === 'prompt') {
      const result = await this.requestPermissions();
      return result.display === 'granted';
    }

    // Permission denied
    return false;
  }

  /**
   * Schedule notifications for a single medication
   */
  async schedulePillNotifications(
    pill: PillSetting,
    startDate: Date = new Date()
  ): Promise<number[]> {
    if (!pill.notificationsEnabled) {
      return [];
    }

    if (this.getMedicationReminderTimes(pill).length === 0) {
      return [];
    }

    // Ensure permissions
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    try {
      if (this.isNativePlatform) {
        return await this.scheduleMobileNotifications(pill, startDate);
      } else {
        return await this.scheduleWebNotifications(pill, startDate);
      }
    } catch (error) {
      throw new Error(`Notification scheduling error for ${pill.name}: ${error}`);
    }
  }

  /**
   * Schedule notifications using Capacitor (Mobile)
   */
  private async scheduleMobileNotifications(
    pill: PillSetting,
    startDate: Date
  ): Promise<number[]> {
    const notifications: LocalNotificationSchema[] = [];
    const scheduledIds: number[] = [];
    const maxNotifications = 30;

    this.forEachScheduledReminder(pill, startDate, maxNotifications, (scheduledDate, reminder, index) => {
      if (scheduledDate <= new Date()) return;

      const notificationId = this.generateNotificationId(pill.id, index);
      scheduledIds.push(notificationId);

      notifications.push({
        id: notificationId,
        title: `💊 ${pill.name}`,
        body: this.getNotificationBody(pill, reminder),
        schedule: {
          at: scheduledDate,
        },
        channelId: this.NOTIFICATION_CHANNEL.id,
        actionTypeId: 'medication-reminder',
        extra: {
          pillId: pill.id,
          pillName: pill.name,
          dosage: reminder.dose,
          type: pill.type,
        },
      });
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications,
      });
    }

    return scheduledIds;
  }

  /**
   * Schedule notifications using Web Notifications API (Browser)
   */
  private async scheduleWebNotifications(
    pill: PillSetting,
    startDate: Date
  ): Promise<number[]> {

    const scheduledIds: number[] = [];
    const maxNotifications = 30;
    const minDelayMs = 30 * 1000; // 30 seconds minimum

    // Cancel existing web notifications for this pill
    await this.cancelWebNotificationsForPill(pill.id);

    const now = new Date();
    const storedNotifications: StoredWebNotification[] = [];

    this.forEachScheduledReminder(pill, startDate, maxNotifications, (scheduledDate, reminder, index) => {
      const delay = scheduledDate.getTime() - now.getTime();

      // Skip if too soon or in the past
      if (delay < minDelayMs) {
        return;
      }

      // Skip if delay exceeds max safe setTimeout value — would fire immediately due to 32-bit overflow
      if (delay > MAX_TIMEOUT_MS) {
        return;
      }

      const notificationId = this.generateNotificationId(pill.id, index);
      scheduledIds.push(notificationId);

      const title = `💊 ${pill.name}`;
      const body = this.getNotificationBody(pill, reminder);

      // Schedule using setTimeout
      const timeoutId = window.setTimeout(() => {
        void this.showWebNotificationById(title, body, notificationId, pill.id);
        this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
          n => n.id !== notificationId
        );
        this.removeNotificationFromStorage(notificationId);
      }, delay);

      this.scheduledWebNotifications.push({
        id: notificationId,
        pillId: pill.id,
        scheduledTime: scheduledDate,
        timeoutId,
      });

      storedNotifications.push({
        id: notificationId,
        pillId: pill.id,
        title,
        body,
        scheduledTime: scheduledDate.toISOString(),
      });
    });

    this.saveWebNotificationsToStorage(storedNotifications, pill.id);

    return scheduledIds;
  }

  /**
   * Show a web notification for a PillSetting (used during an active session)
   */
  private showWebNotification(pill: PillSetting, notificationId: number): void {
    void this.showWebNotificationById(
      `💊 ${pill.name}`,
      this.getNotificationBody(pill),
      notificationId,
      pill.id
    );
  }

  /**
   * Show a web notification by title/body (used for restoration after page reload)
   */
  private async showWebNotificationById(title: string, body: string, notificationId: number, pillId: string): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body,
      icon: 'dist/logo-big.png',
      badge: 'dist/logo-big.pngg',
      tag: `pill-${pillId}-${notificationId}`,
      requireInteraction: false,
      data: { pillId, notificationId, url: '/' },
    };

    // Always prefer SW notifications when a service worker is registered.
    // navigator.serviceWorker.controller is null on first load (before claim()),
    // but navigator.serviceWorker.ready resolves as soon as an active SW exists.
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
        return;
      } catch (e) {
      }
    }

    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  /**
   * Cancel web notifications for a specific pill
   */
  private async cancelWebNotificationsForPill(pillId: string): Promise<void> {
    this.scheduledWebNotifications
      .filter(n => n.pillId === pillId)
      .forEach(n => clearTimeout(n.timeoutId));

    this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
      n => n.pillId !== pillId
    );

    // Remove from localStorage
    this.saveWebNotificationsToStorage([], pillId);
  }

  /**
   * Merge and save scheduled notifications to localStorage.
   * `incoming` replaces any existing entries for the same pillId.
   */
  private saveWebNotificationsToStorage(
    incoming: StoredWebNotification[] = [],
    replacePillId?: string
  ): void {
    try {
      let existing: StoredWebNotification[] = [];
      const raw = localStorage.getItem('pilliox_scheduled_notifications');
      if (raw) existing = JSON.parse(raw);

      const filtered = replacePillId
        ? existing.filter(n => n.pillId !== replacePillId)
        : existing;

      localStorage.setItem(
        'pilliox_scheduled_notifications',
        JSON.stringify([...filtered, ...incoming])
      );
    } catch (error) {
    }
  }

  /**
   * Restore scheduled notifications from localStorage after a page reload.
   * Missed notifications (within a 1-hour grace window) are shown immediately.
   */
  private loadWebNotificationsFromStorage(): void {
    try {
      const raw = localStorage.getItem('pilliox_scheduled_notifications');
      if (!raw) return;

      const stored: StoredWebNotification[] = JSON.parse(raw);
      const now = Date.now();
      const graceMs = 60 * 60 * 1000; // 1-hour grace window for missed notifications

      for (const item of stored) {
        const scheduledAt = new Date(item.scheduledTime).getTime();
        const delay = scheduledAt - now;

        if (delay < 0) {
          // Missed — show immediately if within grace window
          if (now - scheduledAt <= graceMs) {
            this.showWebNotificationById(item.title, item.body, item.id, item.pillId);
          }
          continue;
        }

        if (delay > MAX_TIMEOUT_MS) continue; // Too far out — will be rescheduled on next sync

        const timeoutId = window.setTimeout(() => {
          void this.showWebNotificationById(item.title, item.body, item.id, item.pillId);
          this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
            n => n.id !== item.id
          );
          this.removeNotificationFromStorage(item.id);
        }, delay);

        this.scheduledWebNotifications.push({
          id: item.id,
          pillId: item.pillId,
          scheduledTime: new Date(item.scheduledTime),
          timeoutId,
        });
      }
    } catch (error) {
    }
  }

  /**
   * Remove a single notification entry from localStorage by its ID
   */
  private removeNotificationFromStorage(notificationId: number): void {
    try {
      const raw = localStorage.getItem('pilliox_scheduled_notifications');
      if (!raw) return;
      const stored: StoredWebNotification[] = JSON.parse(raw);
      localStorage.setItem(
        'pilliox_scheduled_notifications',
        JSON.stringify(stored.filter(n => n.id !== notificationId))
      );
    } catch (error) {
    }
  }

  /**
   * Schedule a single one-time notification for a specific date and time.
   * Used for ad-hoc medications that have a reminder set for a particular day.
   */
  async scheduleOneTimeNotification(
    id: string,
    scheduledDate: Date,
    title: string,
    body: string,
  ): Promise<void> {
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) return;

    if (this.isNativePlatform) {
      if (scheduledDate <= new Date()) return;
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 2147483647,
          title,
          body,
          schedule: { at: scheduledDate },
          channelId: this.NOTIFICATION_CHANNEL.id,
        }],
      });
      return;
    }

    const delay = scheduledDate.getTime() - Date.now();
    if (delay < 30_000 || delay > MAX_TIMEOUT_MS) return;

    const notificationId = Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 2147483647;

    // Cancel any existing one for this id
    const existing = this.scheduledWebNotifications.find(n => n.id === notificationId);
    if (existing) {
      clearTimeout(existing.timeoutId);
      this.scheduledWebNotifications = this.scheduledWebNotifications.filter(n => n.id !== notificationId);
    }

    const timeoutId = window.setTimeout(() => {
      void this.showWebNotificationById(title, body, notificationId, id);
      this.scheduledWebNotifications = this.scheduledWebNotifications.filter(n => n.id !== notificationId);
      this.removeNotificationFromStorage(notificationId);
    }, delay);

    this.scheduledWebNotifications.push({ id: notificationId, pillId: id, scheduledTime: scheduledDate, timeoutId });

    const stored: StoredWebNotification = { id: notificationId, pillId: id, title, body, scheduledTime: scheduledDate.toISOString() };
    this.saveWebNotificationsToStorage([stored], id);
  }

  /**
   * Generate unique notification ID based on pill ID and index
   */
  private generateNotificationId(pillId: string, index: number): number {
    const hash = pillId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return (hash * 1000 + index) % 2147483647;
  }

  /**
   * Resolve reminder times from the current schedule model, with legacy fallback.
   */
  private getMedicationReminderTimes(pill: PillSetting): MedicationReminderTime[] {
    if (pill.scheduleType === 'as_needed') {
      return [];
    }

    const scheduledTimes = (pill.scheduleTimes ?? [])
      .filter((entry) => /^\d{2}:\d{2}$/.test(entry.time))
      .map((entry) => ({
        time: entry.time,
        dose: entry.dose || pill.defaultDosage,
        unit: entry.unit ?? pill.unit,
      }));

    if (scheduledTimes.length > 0) {
      return scheduledTimes;
    }

    if (!pill.notificationTime || !/^\d{2}:\d{2}$/.test(pill.notificationTime)) {
      return [];
    }

    return [{
      time: pill.notificationTime,
      dose: pill.defaultDosage,
      unit: pill.unit,
    }];
  }

  private forEachScheduledReminder(
    pill: PillSetting,
    startDate: Date,
    maxNotifications: number,
    callback: (scheduledDate: Date, reminder: MedicationReminderTime, index: number) => void
  ): void {
    const reminderTimes = this.getMedicationReminderTimes(pill);
    if (reminderTimes.length === 0) return;

    let scheduledCount = 0;
    let dayOffset = 0;
    const maxDaysToCheck = Math.max(365, maxNotifications * (pill.scheduleCycleDays ?? 1));

    while (scheduledCount < maxNotifications && dayOffset <= maxDaysToCheck) {
      const scheduledDay = new Date(startDate);
      scheduledDay.setDate(startDate.getDate() + dayOffset);

      if (this.isMedicationScheduledOnDay(pill, scheduledDay, dayOffset)) {
        for (const reminder of reminderTimes) {
          if (scheduledCount >= maxNotifications) break;

          const [hours, minutes] = reminder.time.split(':').map(Number);
          const scheduledDate = new Date(scheduledDay);
          scheduledDate.setHours(hours, minutes, 0, 0);
          callback(scheduledDate, reminder, scheduledCount);
          scheduledCount += 1;
        }
      }

      dayOffset += 1;
    }
  }

  private isMedicationScheduledOnDay(pill: PillSetting, date: Date, dayOffset: number): boolean {
    if (!pill.scheduleType || pill.scheduleType === 'daily') {
      return this.isLegacyFrequencyDay(pill, dayOffset);
    }

    if (pill.scheduleType === 'specific_days') {
      return (pill.scheduleSpecificDays ?? []).includes(date.getDay());
    }

    if (pill.scheduleType === 'cyclic') {
      const startDate = pill.scheduleStartDate ? new Date(`${pill.scheduleStartDate}T00:00:00`) : new Date();
      const dayDiff = diffCalendarDays(date, startDate);
      return dayDiff >= 0 && dayDiff % Math.max(1, pill.scheduleCycleDays ?? 1) === 0;
    }

    return false;
  }

  private isLegacyFrequencyDay(pill: PillSetting, dayOffset: number): boolean {
    const frequencyMap = {
      daily: 1,
      every2days: 2,
      every3days: 3,
    };
    const frequencyDays = frequencyMap[pill.notificationFrequency || 'daily'];
    return dayOffset % frequencyDays === 0;
  }

  /**
   * Get notification body text based on pill type
   */
  private getNotificationBody(pill: PillSetting, reminder?: MedicationReminderTime): string {
    if (pill.type === 'value') {
      return `Time to record your ${pill.name} value`;
    }

    const dose = reminder?.dose ?? pill.defaultDosage;
    const unit = reminder?.unit;

    if (unit) {
      return `Time to take ${dose} ${unit}`;
    }
    
    const dosageText = dose === 1 
      ? '1 pill' 
      : `${dose} pills`;
    
    return `Time to take ${dosageText}`;
  }

  /**
   * Cancel all notifications for a specific medication
   */
  async cancelPillNotifications(pillId: string): Promise<void> {
    try {
      if (this.isNativePlatform) {
        // Mobile: Cancel Capacitor notifications
        const pending: PendingResult = await LocalNotifications.getPending();
        const pillNotificationIds = pending.notifications
          .filter((n) => n.extra?.pillId === pillId)
          .map((n) => n.id);

        if (pillNotificationIds.length > 0) {
          await LocalNotifications.cancel({
            notifications: pillNotificationIds.map(id => ({ id })),
          });
        }
      } else {
        // Web: Cancel scheduled timeouts
        await this.cancelWebNotificationsForPill(pillId);
      }
    } catch (error) {
      throw new Error(`Notification cancellation error: ${error}`);
    }
  }

  /**
   * Update notifications for a medication (cancel old, schedule new)
   */
  async updatePillNotifications(pill: PillSetting): Promise<void> {
    try {
      await this.cancelPillNotifications(pill.id);

      if (pill.notificationsEnabled) {
        await this.schedulePillNotifications(pill);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync all pill notifications (typically called after settings change)
   */
  async syncAllNotifications(pills: PillSetting[]): Promise<void> {
    try {
      if (this.isNativePlatform) {
        const pending: PendingResult = await LocalNotifications.getPending();

        const currentPillIds = new Set(pills.map(p => p.id));
        const orphanedNotifications = pending.notifications
          .filter(n => n.extra?.pillId && !currentPillIds.has(n.extra.pillId))
          .map(n => ({ id: n.id }));

        if (orphanedNotifications.length > 0) {
          await LocalNotifications.cancel({ notifications: orphanedNotifications });
        }
      } else {
        const currentPillIds = new Set(pills.map(p => p.id));
        const orphanedNotifications = this.scheduledWebNotifications.filter(
          n => !currentPillIds.has(n.pillId)
        );

        orphanedNotifications.forEach(n => clearTimeout(n.timeoutId));
        this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
          n => currentPillIds.has(n.pillId)
        );

        if (orphanedNotifications.length > 0) {
          this.saveWebNotificationsToStorage();
        }
      }

      for (const pill of pills) {
        await this.updatePillNotifications(pill);
      }
    } catch (error) {
      throw new Error(`Notification sync error: ${error}`);
    }
  }

  /**
   * Send a test notification immediately (for testing purposes)
   */
  async sendTestNotification(): Promise<void> {
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    try {
      if (this.isNativePlatform) {
        // Mobile: Use Capacitor to send immediate notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999999,
              title: '💊 Test Notification',
              body: 'If you can see this, notifications are working!',
              schedule: {
                at: new Date(Date.now() + 1000), // 1 second from now
              },
              channelId: this.NOTIFICATION_CHANNEL.id,
            },
          ],
        });
      } else {
        await this.showWebNotificationById(
          '💊 Test Notification',
          'If you can see this, notifications are working!',
          999999,
          'test',
        );
      }
    } catch (error) {
      throw new Error(`Test notification error: ${error}`);
    }
  }

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    try {
      if (this.isNativePlatform) {
        const result: PendingResult = await LocalNotifications.getPending();
        return result.notifications;
      } else {
        return this.scheduledWebNotifications.map(n => ({
          id: n.id,
          extra: { pillId: n.pillId },
          schedule: { at: n.scheduledTime },
        }));
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (this.isNativePlatform) {
        const pending = await this.getPendingNotifications();
        if (pending.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.map(n => ({ id: n.id })),
          });
        }
      } else {
        this.scheduledWebNotifications.forEach(n => clearTimeout(n.timeoutId));
        this.scheduledWebNotifications = [];
        localStorage.removeItem('pilliox_scheduled_notifications');
      }
    } catch (error) {
      throw new Error(`Failed to cancel notifications: ${error}`);
    }
  }

  /**
   * Clean up - remove all listeners
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isNativePlatform) {
        await LocalNotifications.removeAllListeners();
      } else {
        this.scheduledWebNotifications.forEach(n => clearTimeout(n.timeoutId));
        this.scheduledWebNotifications = [];
      }
      this.initialized = false;
    } catch (error) {
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
