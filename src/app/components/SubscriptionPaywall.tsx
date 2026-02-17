import { useSubscription } from "../hooks/useSubscription";
import { useTranslation } from "react-i18next";
import {
  Crown,
  Check,
  Loader2,
  RefreshCw,
  LogOut,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function SubscriptionPaywall({
  onLogout,
}: {
  onLogout?: () => void;
}) {
  const {
    status,
    loading,
    openCheckout,
    openPortal,
    syncSubscription,
    resetSubscription,
    refreshStatus,
  } = useSubscription();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncSubscription();
      await refreshStatus();
      toast.success("Subscription synced successfully!");
    } catch (error) {
      toast.error("Failed to sync subscription");
    } finally {
      setSyncing(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetSubscription();
      await refreshStatus();
      toast.success(
        "Subscription reset! You can now create a new subscription.",
      );
    } catch (error) {
      toast.error("Failed to reset subscription");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    // Don't show loading spinner if user has access (trial or active subscription)
    if (status?.hasAccess) {
      return null;
    }

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show paywall if user has access OR has a subscription ID
  // (even if status hasn't synced yet from Stripe)
  if (
    status?.hasAccess ||
    status?.subscription?.stripeSubscriptionId
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 border border-border"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mb-4">
            <Crown className="size-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("subscription.paywallTitle")}
          </h2>
          <p className="text-muted-foreground">
            {t("subscription.paywallDescription")}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            t("subscription.feature1"),
            t("subscription.feature2"),
            t("subscription.feature3"),
            t("subscription.feature4"),
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 size-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="size-3 text-green-500" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="bg-muted rounded-lg p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-1">
            €2.99
            <span className="text-lg font-normal text-muted-foreground">
              /month
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("subscription.pricing")}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={async () => {
            try {
              // If user has an active subscription, open portal instead of checkout
              if (
                status?.subscription?.status === "active" ||
                status?.subscription?.stripeSubscriptionId
              ) {
                await openPortal();
              } else {
                await openCheckout();
              }
            } catch (error: any) {
              // Error is already shown via toast in useSubscription
            }
          }}
        >
          {status?.subscription?.status === "active" ||
          status?.subscription?.stripeSubscriptionId
            ? t("subscription.manageSubscription")
            : t("subscription.subscribeNow")}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {t("subscription.cancelAnytime")}
        </p>

        {/* Action Buttons */}
        <div className="flex mt-6 pt-6 justify-between border-t border-border">
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            {syncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("subscription.syncSubscription")}
          </Button>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
            >
              <LogOut className="size-4" />
              {t("subscription.logout")}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}