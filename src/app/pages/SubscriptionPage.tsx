import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../hooks/useSubscription";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Check, ArrowLeft, Crown, Zap, Pill, Droplet, Bell, Palette, Download, HeadphonesIcon } from "lucide-react";
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
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openPortal();
    } catch (error) {
    }
  };

  if (loading) {
    return (
    <div className="">
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
    <div className="">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 flex items-center gap-4">
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

      <div className="max-w-2xl mx-auto px-4 pb-4 space-y-6">
        {/* Current Status Card */}


        {/* Subscription Details Card - Only show if active or trialing */}
        {(isActive || isTrialing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card className="p-6">

              <div className="space-y-3">
                {/* Plan & Price */}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className=" text-muted-foreground">
                    {t("subscription.plan") || "Plan"}
                  </span>
                  <span className=" font-semibold text-foreground">
                    {isActive
                      ? "Premium - €2.99/month"
                      : "Free Trial"}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className=" text-muted-foreground">
                    {t("subscription.status") || "Status"}
                  </span>
                  <span
                    className={` font-medium px-2.5 py-0.5 rounded-full ${
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
                    <span className=" text-muted-foreground">
                      {t("subscription.trialDaysRemaining") ||
                        "Trial Days Left"}
                    </span>
                    <span className=" font-semibold text-foreground">
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
                    <span className=" text-muted-foreground">
                      {status.subscription.cancelAtPeriodEnd
                        ? t("subscription.expiresOn") ||
                          "Expires On"
                        : isActive
                          ? t("subscription.renewsOn") ||
                            "Next Billing"
                          : t("subscription.trialEndsOn") ||
                            "Trial Ends"}
                    </span>
                    <span className=" font-semibold text-foreground">
                      {formatDate(
                        status.subscription.currentPeriodEnd,
                      )}
                    </span>
                  </div>
                )}

                {/* Trial End Date (if trialing) */}
                {isTrialing && trialEndsAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">
                      {t("subscription.trialEndsOn") ||
                        "Trial Ends"}
                    </span>
                    <span className=" font-semibold text-foreground">
                      {formatDate(status.trialEndsAt)}
                    </span>
                  </div>
                )}

                {/* Price (only if active) */}
                {isActive && (
                  <div className="flex items-center justify-between py-2">
                    <span className=" text-muted-foreground">
                      {t("subscription.pricing") || "Price"}
                    </span>
                    <span className=" font-semibold text-foreground">
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
              {isActive && (
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
        {!isActive && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            {/* Gradient header */}
            <div className="relative bg-linear-to-t from-sky-500 to-indigo-500 p-6 text-white">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium bg-white/20 px-2.5 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  {t("subscription.premiumFeatures") || "Unlock Premium"}
                </h3>
                <p className="text-white/75 text-sm">
                  {t("subscription.premiumDescription") || "Unlock the full potential of Pilliox"}
                </p>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="p-6 space-y-4 border-b border-border">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">€2.99</span>
                <span className="text-muted-foreground">/ {t("subscription.month") || "month"}</span>
  
              </div>
              <Button
                onClick={handleSubscribe}
                className="w-full h-12 bg-linear-to-t from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isTrialing
                  ? t("subscription.upgradeToPremium") || "Upgrade to Premium"
                  : t("subscription.startFreeTrial") || "Start 3-Day Free Trial"}
              </Button>
                            <span className="text-center text-sm text-muted-foreground">
                  {t("subscription.cancelAnytime") || "Cancel anytime"}
                </span>
              {!isTrialing && (
                <p className="text-center text-sm text-muted-foreground">
                  {t("subscription.trialInfo") || "Start your 3-day free trial. No credit card required upfront."}
                </p>
              )}
            </div>

            {/* Feature list */}
            <div className="p-6 space-y-2">
              {(
                [
                  { icon: Pill,           label: t("subscription.feature1") || "Unlimited medication tracking",              color: "text-blue-500",   bg: "bg-blue-100 dark:bg-blue-900/30" },
                  { icon: Droplet,        label: t("subscription.feature2") || "INR and blood test value monitoring",        color: "text-cyan-500",   bg: "bg-cyan-100 dark:bg-cyan-900/30" },
                  { icon: Bell,           label: t("subscription.feature3") || "Smart notifications and reminders",          color: "text-amber-500",  bg: "bg-amber-100 dark:bg-amber-900/30" },
                  { icon: Palette,        label: t("subscription.feature4") || "Multi-day color coding for treatment periods", color: "text-pink-500", bg: "bg-pink-100 dark:bg-pink-900/30" },
                  { icon: Download,       label: t("subscription.feature5") || "Data export and backup",                    color: "text-green-500",  bg: "bg-green-100 dark:bg-green-900/30" },
                  { icon: HeadphonesIcon, label: t("subscription.feature6") || "Priority customer support",                 color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
                ] as const
              ).map(({ icon: Icon, label, color, bg }, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.15 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-sm text-foreground flex-1">{label}</span>
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>}


      </div>
    </div>
  );
}