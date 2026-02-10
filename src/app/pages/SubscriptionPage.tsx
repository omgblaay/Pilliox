import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../hooks/useSubscription";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Check, ArrowLeft, Crown, Zap } from "lucide-react";
import { motion } from "motion/react";

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    status, 
    loading, 
    openCheckout, 
    openPortal 
  } = useSubscription();

  const handleSubscribe = async () => {
    try {
      await openCheckout();
    } catch (error) {
      console.error("Failed to create checkout session:", error);
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
            variant="ghost"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  {isActive
                    ? t("subscription.statusActive") || "Premium Active"
                    : isTrialing
                    ? t("subscription.statusTrial") || "Free Trial"
                    : t("subscription.statusInactive") || "No Active Subscription"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isTrialing && trialEndsAt
                    ? `${t("subscription.trialEndsOn") || "Trial ends on"} ${formatDate(status.trialEndsAt)}`
                    : isActive
                    ? t("subscription.premiumAccess") || "Full access to all features"
                    : t("subscription.upgradeToPremium") || "Upgrade to unlock all features"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("subscription.premiumFeatures") || "Premium Features"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("subscription.premiumDescription") || "Unlock the full potential of Pilliox"}
              </p>
            </div>

            <div className="space-y-3">
              {[
                t("subscription.feature1") || "Unlimited medication tracking",
                t("subscription.feature2") || "INR and blood test value monitoring",
                t("subscription.feature3") || "Smart notifications and reminders",
                t("subscription.feature4") || "Multi-day color coding for treatment periods",
                t("subscription.feature5") || "Data export and backup",
                t("subscription.feature6") || "Priority customer support",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded-full mt-0.5">
                    <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
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
                  <span className="text-4xl font-bold text-foreground">€2.99</span>
                  <span className="text-muted-foreground">
                    / {t("subscription.month") || "month"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("subscription.cancelAnytime") || "Cancel anytime, no commitment"}
                </p>
              </div>

              <Button
                onClick={handleSubscribe}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isTrialing
                  ? t("subscription.upgradeToPremium") || "Upgrade to Premium"
                  : t("subscription.startFreeTrial") || "Start 3-Day Free Trial"}
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
              className="w-full"
            >
              {t("subscription.manage") || "Manage Subscription"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}