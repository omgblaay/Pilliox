import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../hooks/useSubscription";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Check, ArrowLeft, Crown, Zap } from "lucide-react";
import { motion } from "motion/react";

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status, loading, openCheckout, openPortal } =
    useSubscription();

  const handleSubscribe = async () => {
    try {
      await openCheckout();
    } catch (error) {
      console.error(
        "Failed to create checkout session:",
        error,
      );
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openPortal();
    } catch (error) {
      console.error("Failed to open portal:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {t("subscription.loading") || "Loading..."}
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isActive = status.subscription.status === "active";
  const isTrialing = status.isTrialActive;
  const trialEndsAt = status.trialEndsAt
    ? new Date(status.trialEndsAt)
    : null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/app")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            {t("subscription.title") || "Subscription"}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Current Status Card */}


        {/* Subscription Details Card - Only show if active or trialing */}
        {(isActive || isTrialing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t("subscription.plan") ||
                  "Subscription Details"}
              </h3>

              <div className="space-y-3">
                {/* Plan & Price */}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    {t("subscription.plan") || "Plan"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {isActive
                      ? "Premium - €2.99/month"
                      : "Free Trial"}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    {t("subscription.status") || "Status"}
                  </span>
                  <span
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                        : isTrialing
                          ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {isActive
                      ? t("subscription.statusActive") ||
                        "Active"
                      : isTrialing
                        ? t("subscription.statusTrial") ||
                          "Trial"
                        : t("subscription.statusInactive") ||
                          "Inactive"}
                  </span>
                </div>

                {/* Trial Days Remaining */}
                {isTrialing && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      {t("subscription.trialDaysRemaining") ||
                        "Trial Days Left"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {status.trialDaysLeft}{" "}
                      {status.trialDaysLeft === 1
                        ? "day"
                        : "days"}
                    </span>
                  </div>
                )}

                {/* Next Billing / Expiry Date */}
                {status.subscription.currentPeriodEnd && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      {status.subscription.cancelAtPeriodEnd
                        ? t("subscription.expiresOn") ||
                          "Expires On"
                        : isActive
                          ? t("subscription.renewsOn") ||
                            "Next Billing"
                          : t("subscription.trialEndsOn") ||
                            "Trial Ends"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(
                        status.subscription.currentPeriodEnd,
                      )}
                    </span>
                  </div>
                )}

                {/* Trial End Date (if trialing) */}
                {isTrialing && trialEndsAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      {t("subscription.trialEndsOn") ||
                        "Trial Ends"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(status.trialEndsAt)}
                    </span>
                  </div>
                )}

                {/* Price (only if active) */}
                {isActive && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      {t("subscription.pricing") || "Price"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      €2.99 /{" "}
                      {t("subscription.month") || "month"}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancellation Notice */}
              {status.subscription.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Your subscription will be cancelled at the
                    end of the current billing period.
                  </p>
                </div>
              )}
              {/* Manage Subscription */}
              {(isActive || isTrialing) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Button
                    onClick={handleManageSubscription}
                    variant="outline"
                    className="w-full mt-5"
                  >
                    {t("subscription.manage") ||
                      "Manage Subscription"}
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Features Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("subscription.premiumFeatures") ||
                  "Premium Features"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("subscription.premiumDescription") ||
                  "Unlock the full potential of Pilliox"}
              </p>
            </div>

            <div className="space-y-3">
              {[
                t("subscription.feature1") ||
                  "Unlimited medication tracking",
                t("subscription.feature2") ||
                  "INR and blood test value monitoring",
                t("subscription.feature3") ||
                  "Smart notifications and reminders",
                t("subscription.feature4") ||
                  "Multi-day color coding for treatment periods",
                t("subscription.feature5") ||
                  "Data export and backup",
                t("subscription.feature6") ||
                  "Priority customer support",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.05,
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full mt-0.5">
                    <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-foreground">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Pricing Card */}
        {!isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    €2.99
                  </span>
                  <span className="text-muted-foreground">
                    / {t("subscription.month") || "month"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("subscription.cancelAnytime") ||
                    "Cancel anytime, no commitment"}
                </p>
              </div>

              <Button
                onClick={handleSubscribe}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isTrialing
                  ? t("subscription.upgradeToPremium") ||
                    "Upgrade to Premium"
                  : t("subscription.startFreeTrial") ||
                    "Start 3-Day Free Trial"}
              </Button>

              {!isTrialing && (
                <p className="text-xs text-center text-muted-foreground">
                  {t("subscription.trialInfo") ||
                    "Start your 3-day free trial. No credit card required upfront."}
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}