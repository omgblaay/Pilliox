import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { Crown, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

export function SubscriptionBanner() {
  const { status, openCheckout } = useSubscription();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if user has active subscription or dismissed
  if (!status || status.subscription.status === 'active' || dismissed) {
    return null;
  }

  // Show trial banner if trial is active
  if (status.isTrialActive) {
    return (
      <AnimatePresence>
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-w-[772px] mx-4 rounded-xl bg-linear-to-t from-sky-500 to-indigo-500 text-white px-4 py-3"
          >
            <div className="container w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setDismissed(true)}
                  className="flex-shrink-0 cursor-pointer p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {t('subscription.trialActive', { days: status.trialDaysLeft })}
                  </p>
                  <p className="opacity-90">
                    {t('subscription.trialDescription')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await openCheckout();
                  } catch (error) {
                    // Silently handle - error is already shown via toast
                  }
                }}
                className="sm:w-auto w-full flex-shrink-0 bg-white !text-blue-700 px-4 hover:bg-blue-100 transition-colors"
              >
                {t('subscription.subscribeCTA')}
              </Button>

            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Show expired banner if trial ended and no subscription
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative bg-red-600 text-white px-4 py-3"
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Crown className="size-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {t('subscription.trialExpired')}
              </p>
              <p className="text-xs opacity-90">
                {t('subscription.subscribeToAccess')}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await openCheckout();
              } catch (error) {
                // Silently handle - error is already shown via toast
              }
            }}
            className="flex-shrink-0 bg-white text-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('subscription.subscribeNow')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}