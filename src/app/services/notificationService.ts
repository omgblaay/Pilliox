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
          console.warn('Browser does not support notifications');
          throw new Error('Browser does not support notifications');
        }
        // Restore any notifications that were scheduled before a page reload
        if (Notification.permission === 'granted') {
          this.loadWebNotificationsFromStorage();
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
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
      console.error('Failed to create notification channel:', error);
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
      console.error('Failed to request notification permissions:', error);
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
      console.error('Failed to check notification permissions:', error);
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
    console.warn('Notification permissions denied');
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

    if (!pill.notificationTime) {
      console.warn(`No notification time set for ${pill.name}`);
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
      console.error(`Failed to schedule notifications for ${pill.name}:`, error);
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
    const [hours, minutes] = pill.notificationTime!.split(':').map(Number);

    const frequencyMap = {
      daily: 1,
      every2days: 2,
      every3days: 3,
    };
    const frequencyDays = frequencyMap[pill.notificationFrequency || 'daily'];

    const notifications: LocalNotificationSchema[] = [];
    const scheduledIds: number[] = [];
    const maxNotifications = 30;

    for (let i = 0; i < maxNotifications; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + (i * frequencyDays));
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate <= new Date()) {
        continue;
      }

      const notificationId = this.generateNotificationId(pill.id, i);
      scheduledIds.push(notificationId);

      notifications.push({
        id: notificationId,
        title: `💊 ${pill.name}`,
        body: this.getNotificationBody(pill),
        schedule: {
          at: scheduledDate,
        },
        channelId: this.NOTIFICATION_CHANNEL.id,
        actionTypeId: 'medication-reminder',
        extra: {
          pillId: pill.id,
          pillName: pill.name,
          dosage: pill.defaultDosage,
          type: pill.type,
        },
      });
    }

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
    console.log(`[NotificationService] Notification time: ${pill.notificationTime}, Frequency: ${pill.notificationFrequency}`);

    const [hours, minutes] = pill.notificationTime!.split(':').map(Number);

    const frequencyMap = {
      daily: 1,
      every2days: 2,
      every3days: 3,
    };
    const frequencyDays = frequencyMap[pill.notificationFrequency || 'daily'];

    const scheduledIds: number[] = [];
    const maxNotifications = 30;
    const minDelayMs = 2 * 60 * 1000; // 2 minutes minimum

    // Cancel existing web notifications for this pill
    await this.cancelWebNotificationsForPill(pill.id);

    const now = new Date();
    const storedNotifications: StoredWebNotification[] = [];

    for (let i = 0; i < maxNotifications; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + (i * frequencyDays));
      scheduledDate.setHours(hours, minutes, 0, 0);

      const delay = scheduledDate.getTime() - now.getTime();

      // Skip if too soon or in the past
      if (delay < minDelayMs) {
        console.log(`[NotificationService] Skipping notification ${i}: scheduled for ${scheduledDate.toISOString()}, delay is ${(delay / 60000).toFixed(1)} minutes`);
        continue;
      }

      // Skip if delay exceeds max safe setTimeout value — would fire immediately due to 32-bit overflow
      if (delay > MAX_TIMEOUT_MS) {
        console.log(`[NotificationService] Skipping notification ${i}: delay ${Math.floor(delay / 3600000)}h exceeds max setTimeout range`);
        continue;
      }

      const notificationId = this.generateNotificationId(pill.id, i);
      scheduledIds.push(notificationId);

      const delayHours = Math.floor(delay / 3600000);
      const remainingMinutes = Math.floor((delay % 3600000) / 60000);
      console.log(`[NotificationService] Scheduling notification ${notificationId} for ${scheduledDate.toISOString()} (in ${delayHours}h ${remainingMinutes}m)`);

      const title = `💊 ${pill.name}`;
      const body = this.getNotificationBody(pill);

      // Schedule using setTimeout
      const timeoutId = window.setTimeout(() => {
        console.log(`[NotificationService] Showing notification for ${pill.name}`);
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
    }

    console.log(`[NotificationService] Scheduled ${scheduledIds.length} notifications for ${pill.name}`);

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
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `pill-${pillId}-${notificationId}`,
      requireInteraction: false,
      data: { pillId, notificationId, url: '/' },
    };

    // Chrome silently drops new Notification() when a service worker controls the page.
    // Use ServiceWorkerRegistration.showNotification() when a SW is active.
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
        return;
      } catch (e) {
        console.warn('[NotificationService] SW notification failed, falling back to Notification API:', e);
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
      console.error('Failed to save notifications to storage:', error);
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
      console.error('Failed to load notifications from storage:', error);
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
      console.error('Failed to remove notification from storage:', error);
    }
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
   * Get notification body text based on pill type
   */
  private getNotificationBody(pill: PillSetting): string {
    if (pill.type === 'value') {
      return `Time to record your ${pill.name} value`;
    }
    
    const dosageText = pill.defaultDosage === 1 
      ? '1 pill' 
      : `${pill.defaultDosage} pills`;
    
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
      console.error(`Failed to cancel notifications for pill ${pillId}:`, error);
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
      console.error(`Failed to update notifications for ${pill.name}:`, error);
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
      console.error('Failed to sync notifications:', error);
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
        // Web: Show immediate browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('💊 Test Notification', {
            body: 'If you can see this, notifications are working!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            requireInteraction: false,
            vibrate: [200, 100, 200],
          });
        }
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
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
      console.error('Failed to get pending notifications:', error);
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
      console.error('Failed to cancel all notifications:', error);
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
      console.error('Failed to cleanup notification service:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();