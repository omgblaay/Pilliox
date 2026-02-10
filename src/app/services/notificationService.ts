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
    const [hours, minutes] = pill.notificationTime!.split(':').map(Number);

    const frequencyMap = {
      daily: 1,
      every2days: 2,
      every3days: 3,
    };
    const frequencyDays = frequencyMap[pill.notificationFrequency || 'daily'];

    const scheduledIds: number[] = [];
    const maxNotifications = 30;
    const minDelaySeconds = 10; // Minimum 10 seconds in the future to avoid immediate notifications

    // Cancel existing web notifications for this pill
    await this.cancelWebNotificationsForPill(pill.id);

    for (let i = 0; i < maxNotifications; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + (i * frequencyDays));
      scheduledDate.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const delay = scheduledDate.getTime() - now.getTime();
      
      // Skip if scheduled time has passed or is too soon (less than minDelaySeconds)
      if (delay < minDelaySeconds * 1000) {
        continue;
      }

      const notificationId = this.generateNotificationId(pill.id, i);
      scheduledIds.push(notificationId);

      // Schedule using setTimeout
      const timeoutId = window.setTimeout(() => {
        this.showWebNotification(pill, notificationId);
        // Remove from scheduled list after showing
        this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
          n => n.id !== notificationId
        );
      }, delay);

      // Store scheduled notification
      this.scheduledWebNotifications.push({
        id: notificationId,
        pillId: pill.id,
        scheduledTime: scheduledDate,
        timeoutId,
      });
    }

    // Persist scheduled notifications to localStorage
    this.saveWebNotificationsToStorage();

    return scheduledIds;
  }

  /**
   * Show a web notification
   */
  private showWebNotification(pill: PillSetting, notificationId: number): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    const notification = new Notification(`💊 ${pill.name}`, {
      body: this.getNotificationBody(pill),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `pill-${pill.id}-${notificationId}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        pillId: pill.id,
        pillName: pill.name,
        dosage: pill.defaultDosage,
        type: pill.type,
      },
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // TODO: Navigate to calendar or specific medication
    };
  }

  /**
   * Cancel web notifications for a specific pill
   */
  private async cancelWebNotificationsForPill(pillId: string): Promise<void> {
    const notificationsToCancel = this.scheduledWebNotifications.filter(
      n => n.pillId === pillId
    );

    notificationsToCancel.forEach(n => {
      clearTimeout(n.timeoutId);
    });

    this.scheduledWebNotifications = this.scheduledWebNotifications.filter(
      n => n.pillId !== pillId
    );

    this.saveWebNotificationsToStorage();
  }

  /**
   * Save scheduled web notifications to localStorage
   */
  private saveWebNotificationsToStorage(): void {
    try {
      const data = this.scheduledWebNotifications.map(n => ({
        id: n.id,
        pillId: n.pillId,
        scheduledTime: n.scheduledTime.toISOString(),
      }));
      localStorage.setItem('pilliox_scheduled_notifications', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  /**
   * Load scheduled web notifications from localStorage
   * This is called on app initialization to restore notifications after page reload
   */
  private loadWebNotificationsFromStorage(): void {
    try {
      const stored = localStorage.getItem('pilliox_scheduled_notifications');
      if (!stored) return;

      // Note: This just loads the data structure. The actual re-scheduling
      // happens when syncAllNotifications is called with the latest pill settings
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
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
        this.saveWebNotificationsToStorage();
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