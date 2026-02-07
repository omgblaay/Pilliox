import { useSubscription } from "../hooks/useSubscription";
import { useTranslation } from "react-i18next";
import {
  Crown,
  ExternalLink,
  Loader2,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function SubscriptionSettings() {
  const {
    status,
    loading,
    openCheckout,
    openPortal,
    syncSubscription,
  } = useSubscription();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [autoSyncDone, setAutoSyncDone] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncSubscription();
      toast.success(
        "Subscription status updated successfully!",
      );
    } catch (error) {
      toast.error(
        "Failed to sync subscription. Please try again.",
      );
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync on mount if user has subscription ID but not active
  useEffect(() => {
    if (
      !autoSyncDone &&
      status?.subscription?.stripeSubscriptionId &&
      status?.subscription?.status !== "active" &&
      !syncing
    ) {
      setAutoSyncDone(true);
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, autoSyncDone, syncing]); // handleSync is stable, no need to include

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <Crown className="size-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {t("subscription.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("subscription.manageDescription")}
          </p>
        </div>
      </div>

      {/* Trial Status */}
      {status.isTrialActive && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Calendar className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {t("subscription.trialActiveTitle")}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                {t("subscription.trialDaysRemaining", {
                  days: status.trialDaysLeft,
                })}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {t("subscription.trialEndsOn")}{" "}
                {formatDate(status.trialEndsAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">
            {t("subscription.status")}
          </span>
          <span
            className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
              status.subscription.status === "active"
                ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                : status.isTrialActive
                  ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
            }`}
          >
            {status.subscription.status === "active"
              ? t("subscription.statusActive")
              : status.isTrialActive
                ? t("subscription.statusTrial")
                : t("subscription.statusInactive")}
          </span>
        </div>

        {status.subscription.currentPeriodEnd && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">
              {status.subscription.cancelAtPeriodEnd
                ? t("subscription.expiresOn")
                : t("subscription.renewsOn")}
            </span>
            <span className="text-sm font-medium">
              {formatDate(status.subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">
            {t("subscription.plan")}
          </span>
          <span className="text-sm font-medium">
            {status.subscription.status === "active"
              ? "Premium - €2.99/month"
              : "Free Trial"}
          </span>
        </div>
      </div>

      {/* Info banner when payment is pending */}
      {status.subscription.stripeSubscriptionId &&
        status.subscription.status !== "active" &&
        !syncing && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Payment Processing
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Your payment was successful, but the
                  subscription status hasn't updated yet. Click
                  the button below to sync your subscription.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Actions */}
      <div className="space-y-2">
        {status.subscription.status === "active" ? (
          <Button
            onClick={() => openPortal()}
            variant="secondary"
          >
            {t("subscription.manageSubscription")}
            <ExternalLink className="size-4" />
          </Button>
        ) : (
          <>
            <Button
              onClick={() => openCheckout()}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2.5 rounded-lg font-semibold transition-all"
            >
              {t("subscription.upgradeNow")}
            </Button>

            {/* Sync button - only show if user has paid but status not updated */}
            {status.subscription.stripeSubscriptionId &&
              status.subscription.status !== "active" && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4" />
                      Sync Subscription Status
                    </>
                  )}
                </button>
              )}
          </>
        )}

        {/* Always show sync button for debugging */}
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          size="sm"
        >
          {syncing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              Force Sync from Stripe
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        {t("subscription.billingInfo")}
      </p>
    </div>
  );
}