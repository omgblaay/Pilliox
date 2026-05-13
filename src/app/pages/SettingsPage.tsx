import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Moon,
  Sun,
  Globe,
  FileText,
  ArrowLeft,
  Monitor,
  Shield,
  Info,
  Bell,
  Mail,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";
import { LanguageSelector } from "../components/LanguageSelector";
import { AboutModal } from "../components/AboutModal";

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
  const [aboutOpen, setAboutOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [appNotificationPermission, setAppNotificationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  useEffect(() => {
    loadSettings();
    if (typeof Notification !== "undefined") {
      setAppNotificationPermission(
        Notification.permission === "default" ? "prompt" : Notification.permission,
      );
    }
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
        const loadedTheme = data.settings.theme || "system";
        setTheme(loadedTheme);
        localStorage.setItem('pilliox-theme', loadedTheme);
        setWeekStartsOnMonday(
          data.settings.weekStartsOnMonday ?? true,
        );
        setEmailNotifications(data.settings.emailNotifications ?? false);
      }
    } catch (error) {
    }
  };

  const saveSettings = async (
    newSettings: Partial<{
      theme: string;
      weekStartsOnMonday: boolean;
      emailNotifications: boolean;
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
            emailNotifications:
              newSettings.emailNotifications ?? emailNotifications,
          }),
        },
      );
    } catch (error) {
    }
  };

  const handleRequestAppNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setAppNotificationPermission(result === "default" ? "prompt" : result);
  };

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    saveSettings({ emailNotifications: checked });
  };

  const handleThemeChange = (
    newTheme: "light" | "dark" | "system",
  ) => {
    setTheme(newTheme);
    localStorage.setItem('pilliox-theme', newTheme);
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
    <div className="">
      {/* Header */}
      <div className="sticky top-0 bg-background">
        <div className="max-w-screen-lg flex gap-5 items-center mx-auto px-4 sm:py-8 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app")}
            className="h-10 w-10 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg">{t("settings.title") || "Settings"}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 space-y-6">
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
                <div className="flex text-foreground items-center gap-3">
                  <Moon className="text-muted-foreground" />
                      {t("settings.theme.title") || "Theme"}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                <Button
                  variant="tabGroup"
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("light")}
                  data-state={
                    theme === "light" ? "active" : "inactive"
                  }
                >
                  <Sun className="size-5" />
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
                  <Moon className="size-5" />
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
                  <Monitor className="size-5" />
                  {t("settings.theme.system") || "System"}
                </Button>
              </div>
            </div>

            {/* Language */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-foreground gap-3">
                  <Globe className="size-5 text-muted-foreground" />
                      {t("settings.language.title") ||
                        "Language"}
                </div>
                <LanguageSelector variant="outline" />
              </div>
            </div>
            {/* Calendar First Day */}
           <div className="p-4 flex flex-col  sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <p className="font-medium text-foreground mx-[0px] mt-[0px] mb-[8px]">
                  {t("settings.weekStart.title") ||
                    "Week starts on Monday"}
                </p>
                <p className="text-muted-foreground">
                  {t("settings.weekStart.description") ||
                    "Change calendar week start day"}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
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

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.notifications.title")}
          </h2>
          <Card className="divide-y divide-border">
            <Button
              variant="menuItem"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="size-5 text-muted-foreground" />
              {t("settings.notifications.menuItem")}
            </Button>
          </Card>
        </motion.div>

        {/* Legal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.legal.title") || "Other"}
          </h2>
          <Card className="divide-y divide-border">
            <Button
              variant="menuItem"
              onClick={onNavigateToTerms}
            >
                <FileText/>
                  {t("settings.termsOfService") ||
                    "Terms of Service"}
            </Button>

            <Button
              variant="menuItem"
              onClick={onNavigateToPrivacy}
            >
                <Shield/>
                  {t("settings.privacyPolicy") ||
                    "Privacy Policy"}
            </Button>
            <Button
              variant="menuItem"
              onClick={() => setAboutOpen(true)}
            >
                <Info />
                  {t("about.title") ||
                    "About Pilliox"}
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
            Pilliox v1.8.0
          </p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              {t("settings.notifications.menuItem")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.notifications.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 sm:py-2 pt-20">
            {/* App notifications */}
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-muted p-2">
                <Smartphone className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-base">{t("settings.notifications.appNotifications")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.appNotificationsDesc")}
                </p>
                {appNotificationPermission === "granted" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Bell className="size-3" /> {t("settings.notifications.enabled")}
                  </span>
                ) : appNotificationPermission === "denied" ? (
                  <p className="text-xs text-destructive">
                    {t("settings.notifications.blocked")}
                  </p>
                ) : (
                  <Button size="sm" variant="outline" className="mt-1" onClick={handleRequestAppNotifications}>
                    {t("settings.notifications.enableButton")}
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Email notifications */}
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-muted p-2">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-base">{t("settings.notifications.emailReminders")}</Label>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationsChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.emailRemindersDesc")}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}