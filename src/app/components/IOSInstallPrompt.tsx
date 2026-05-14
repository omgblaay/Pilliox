import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";

const DISMISSED_KEY = "pilliox_ios_install_dismissed";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function IOSInstallPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Show after 3 s so it doesn't interrupt initial load
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <div className="bg-popover border border-border rounded-2xl p-4 shadow-2xl max-w-sm mx-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">{t("iosInstall.title")}</p>
                  <p className="text-xs text-muted-foreground">{t("iosInstall.subtitle")}</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <ol className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs font-semibold">1</span>
                <span>
                  {t("iosInstall.step1prefix")}{" "}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Share className="size-3.5 text-blue-500" />
                    {t("iosInstall.step1share")}
                  </span>{" "}
                  {t("iosInstall.step1suffix")}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs font-semibold">2</span>
                <span>
                  {t("iosInstall.step2prefix")}{" "}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Plus className="size-3.5" />
                    {t("iosInstall.step2action")}
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs font-semibold">3</span>
                <span>{t("iosInstall.step3prefix")} <span className="font-medium">{t("iosInstall.step3action")}</span> {t("iosInstall.step3suffix")}</span>
              </li>
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
