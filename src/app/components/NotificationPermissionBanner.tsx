/**
 * Notification Permission Banner
 * Displays a banner asking user to enable browser notifications
 * Only shown on web platform when notifications are not enabled
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, TestTube } from 'lucide-react';
import { Button } from './ui/button';
import { useNotifications } from '../hooks/useNotifications';
import { Capacitor } from '@capacitor/core';
import { notificationService } from '../services/notificationService';

export function NotificationPermissionBanner() {
  const { t } = useTranslation();
  const { permissions, requestPermissions } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [testing, setTesting] = useState(false);
  const isWeb = !Capacitor.isNativePlatform();

  // Check if banner was previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pilliox_notification_banner_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pilliox_notification_banner_dismissed', 'true');
  };

  const handleEnableNotifications = async () => {
    setRequesting(true);
    try {
      const granted = await requestPermissions();
      if (granted) {
        // Auto-dismiss on success
        setDismissed(true);
      }
    } catch (error) {
    } finally {
      setRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
    } finally {
      setTesting(false);
    }
  };

  // Don't show banner if:
  // - Not on web platform (mobile native apps handle permissions differently)
  // - Permissions already granted
  // - User dismissed the banner
  // - Still loading permission status

  if (!isWeb || permissions.granted || dismissed || permissions.loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 mb-4 mx-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t('pillsSettings.bannerTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t('pillsSettings.bannerDescription')}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              disabled={requesting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {requesting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                  {t('pillsSettings.requesting')}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-1" />
                  {t('pillsSettings.enableButton')}
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              {t('pillsSettings.notNow')}
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}