/**
 * useNotifications Hook
 * Manages notification initialization and synchronization
 */

import { useEffect, useCallback, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { PillSetting } from '../components/PillsSettings';

export interface NotificationPermissions {
  granted: boolean;
  loading: boolean;
  error: string | null;
}

export function useNotifications() {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    granted: false,
    loading: true,
    error: null,
  });

  /**
   * Initialize notification service on mount
   */
  useEffect(() => {
    let mounted = true;

    const checkAndSet = async () => {
      try {
        await notificationService.initialize();

        const isWeb = typeof window !== 'undefined' && 'Notification' in window;
        const granted = isWeb
          ? Notification.permission === 'granted'
          : (await notificationService.checkPermissions()).display === 'granted';

        if (mounted) {
          setPermissions({ granted, loading: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setPermissions({
            granted: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    };

    checkAndSet();

    // Re-check when user comes back from browser settings after granting permission
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkAndSet();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setPermissions(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await notificationService.requestPermissions();
      const granted = result.display === 'granted';
      
      setPermissions({
        granted,
        loading: false,
        error: granted ? null : 'Permission denied',
      });
      
      return granted;
    } catch (error) {
      setPermissions({
        granted: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }, []);

  /**
   * Sync notifications for all pills
   */
  const syncNotifications = useCallback(async (pills: PillSetting[]): Promise<boolean> => {
    try {
      const hasPermission = await notificationService.ensurePermissions();
      if (!hasPermission) {
        return false;
      }

      await notificationService.syncAllNotifications(pills);
      
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Schedule notifications for a single pill
   */
  const schedulePillNotifications = useCallback(async (pill: PillSetting): Promise<boolean> => {
    try {
      if (!pill.notificationsEnabled) {
        return false;
      }

      await notificationService.schedulePillNotifications(pill);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Cancel notifications for a pill
   */
  const cancelPillNotifications = useCallback(async (pillId: string): Promise<void> => {
    try {
      await notificationService.cancelPillNotifications(pillId);
    } catch (error) {
    }
  }, []);

  /**
   * Cancel all notifications
   */
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
    }
  }, []);

  /**
   * Get pending notifications count
   */
  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      const pending = await notificationService.getPendingNotifications();
      return pending.length;
    } catch (error) {
      return 0;
    }
  }, []);

  return {
    permissions,
    requestPermissions,
    syncNotifications,
    schedulePillNotifications,
    cancelPillNotifications,
    cancelAllNotifications,
    getPendingCount,
  };
}