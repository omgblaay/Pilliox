/**
 * Notification Test Button
 * Shows a button to test notifications when permissions are granted
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TestTube } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "../services/notificationService";
import { useNotifications } from "../hooks/useNotifications";
import { toast } from "sonner";

export function NotificationTestButton() {
  const { t } = useTranslation();
  const { permissions } = useNotifications();
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await notificationService.sendTestNotification();
      toast.success(
        t("notifications.testSent") ||
          "Test notification sent!",
      );
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error(
        t("notifications.testFailed") ||
          "Failed to send test notification",
      );
    } finally {
      setTimeout(() => setTesting(false), 1000);
    }
  };

  // Only show if permissions are granted
  if (!permissions.granted) {
    return null;
  }

  return (
    <div className="bg-muted/30 border border-border/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Test notifi{" "}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("notifications.testDescription") ||
              "Send a test notification to verify they are working"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testing}
          className="ml-4"
        >
          {testing ? (
            <>
              <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-2"></div>
              {t("notifications.sending") || "Sending..."}
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              {t("notifications.testButton") || "Send Test"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}