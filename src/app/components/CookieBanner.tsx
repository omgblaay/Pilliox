import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Cookie } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

export function CookieBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies
    const cookieConsent = localStorage.getItem(
      "pilliox-cookie-consent",
    );
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("pilliox-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("pilliox-cookie-consent", "declined");
    setIsVisible(false);
  };

  const handleLearnMore = () => {
    window.open("/docs/privacy", "_blank");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-4 md:p-8">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex">
                      <h3 className="text-lg w-full font-semibold text-gray-900 dark:text-white mb-2">
                        {t("cookies.title")}
                      </h3>{" "}
                      {/* Close button */}
                      <button
                        onClick={handleDecline}
                        className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {t("cookies.description")}
                    </p>
                    {/* Actions */}{" "}
                    <Button
                      onClick={handleLearnMore}
                      variant="link"
                      size="link"
                      className="p-0 mb-4"
                    >
                      {t("cookies.learnMore")}
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDecline}
                        variant="outline"
                      >
                        {t("cookies.decline")}
                      </Button>
                      <Button onClick={handleAccept}>
                        {t("cookies.accept")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}