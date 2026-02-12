import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Moon,
  Sun,
  Globe,
  FileText,
  ChevronRight,
  ArrowLeft,
  Monitor,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";
import { LanguageSelector } from "../components/LanguageSelector";

interface SettingsPageProps {
  accessToken: string;
  onLogout: () => void;
  projectId: string;
  anonKey: string;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

export function SettingsPage({
  accessToken,
  onLogout,
  projectId,
  anonKey,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<
    "light" | "dark" | "system"
  >("system");
  const [weekStartsOnMonday, setWeekStartsOnMonday] =
    useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );
      const data = await response.json();
      if (data.settings) {
        setTheme(data.settings.theme || "system");
        setWeekStartsOnMonday(
          data.settings.weekStartsOnMonday ?? true,
        );
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const saveSettings = async (
    newSettings: Partial<{
      theme: string;
      weekStartsOnMonday: boolean;
    }>,
  ) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify({
            theme: newSettings.theme || theme,
            weekStartsOnMonday:
              newSettings.weekStartsOnMonday ??
              weekStartsOnMonday,
          }),
        },
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleThemeChange = (
    newTheme: "light" | "dark" | "system",
  ) => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme });

    // Apply theme
    if (newTheme === "system") {
      const isDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle(
        "dark",
        newTheme === "dark",
      );
    }
  };

  const handleWeekStartChange = (startsOnMonday: boolean) => {
    setWeekStartsOnMonday(startsOnMonday);
    saveSettings({ weekStartsOnMonday: startsOnMonday });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-screen-lg flex gap-5 items-center mx-auto px-4 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/app")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1>{t("settings.title") || "Settings"}</h1>
            <p className="small">
              {t("settings.subtitle") ||
                "Customize your experience"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.appearance.title") || "Appearance"}
          </h2>
          <Card className="divide-y divide-border">
            {/* Theme */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {t("settings.theme.title") || "Theme"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.theme.description") ||
                        "Choose your color scheme"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                <Button
                  variant="tabGroup"
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("light")}
                  data-state={
                    theme === "light" ? "active" : "inactive"
                  }
                >
                  <Sun className="w-5 h-5" />
                  {t("settings.theme.light") || "Light"}
                </Button>
                <Button
                  variant="tabGroup"
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("dark")}
                  data-state={
                    theme === "dark" ? "active" : "inactive"
                  }
                >
                  <Moon className="w-5 h-5" />
                  {t("settings.theme.dark") || "Dark"}
                </Button>
                <Button
                  variant="tabGroup"
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("system")}
                  data-state={
                    theme === "system" ? "active" : "inactive"
                  }
                >
                  <Monitor className="w-5 h-5" />
                  {t("settings.theme.system") || "System"}
                </Button>
              </div>
            </div>

            {/* Language */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {t("settings.language.title") ||
                        "Language"}
                    </p>
                  </div>
                </div>
                <LanguageSelector variant="outline" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.calendar.title") || "Calendar"}
          </h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground mx-[0px] mt-[0px] mb-[8px]">
                  {t("settings.weekStart.title") ||
                    "Week starts on Monday"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.weekStart.description") ||
                    "Change calendar week start day"}
                </p>
              </div>
              <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                <Button
                  variant="tabGroup"
                  onClick={() => handleWeekStartChange(false)}
                  data-state={
                    !weekStartsOnMonday ? "active" : "inactive"
                  }
                >
                  {t("days.sunday")}
                </Button>
                <Button
                  variant="tabGroup"
                  onClick={() => handleWeekStartChange(true)}
                  data-state={
                    weekStartsOnMonday ? "active" : "inactive"
                  }
                >
                  {t("days.monday")}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Legal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.legal.title") || "Legal"}
          </h2>
          <Card className="divide-y divide-border">
            <Button
              variant="menuItem"
              onClick={onNavigateToTerms}
            >
                <FileText className="w-5 h-5 text-muted-foreground" />
                  {t("settings.termsOfService") ||
                    "Terms of Service"}
            </Button>

            <Button
              variant="menuItem"
              onClick={onNavigateToPrivacy}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {t("settings.privacyPolicy") ||
                    "Privacy Policy"}
                </span>
              </div>
            </Button>
          </Card>
        </motion.div>

        {/* Version */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4 pb-2"
        >
          <p className="text-xs text-muted-foreground">
            Pilliox v1.6.0
          </p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}