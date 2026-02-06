import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { type Theme } from "@/app/hooks/useTheme";
import { cn } from "@/app/components/ui/utils";
import packageJson from "../../../package.json";

interface AppSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  projectId: string;
  anonKey: string;
  theme: Theme;
  onThemeChange?: (theme: Theme) => void;
  weekStartsOnMonday: boolean;
  onWeekStartChange: (startsOnMonday: boolean) => void;
}

export function AppSettings({
  open,
  onOpenChange,
  accessToken,
  projectId,
  anonKey,
  theme,
  onThemeChange,
  weekStartsOnMonday,
  onWeekStartChange,
}: AppSettingsProps) {
  const { t } = useTranslation();
  const [localWeekStartsOnMonday, setLocalWeekStartsOnMonday] =
    useState(weekStartsOnMonday);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  useEffect(() => {
    setLocalWeekStartsOnMonday(weekStartsOnMonday);
  }, [weekStartsOnMonday]);

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

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setLocalWeekStartsOnMonday(
            data.settings.weekStartsOnMonday ?? true,
          );
        }
      } else {
        // Failed to load settings
      }
    } catch (error) {
      // Error loading settings
    }
  };

  const handleWeekStartToggle = async (checked: boolean) => {
    setLocalWeekStartsOnMonday(checked);
    onWeekStartChange(checked);

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
          body: JSON.stringify({ weekStartsOnMonday: checked }),
        },
      );
    } catch (error) {
      // Failed to save week start preference
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    if (onThemeChange) {
      onThemeChange(newTheme);
    }

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
          body: JSON.stringify({ theme: newTheme }),
        },
      );
    } catch (error) {
      // Failed to save theme preference
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <SettingsIcon className="h-6 w-6 text-muted-foreground" />
            {t("settings.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("settings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                {t("settings.theme")}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={
                  theme === "light" ? "default" : "outline"
                }
                className={cn(
                  "flex flex-col items-center gap-2 h-auto py-3",
                  theme === "light" &&
                    "bg-blue-600 hover:bg-blue-700 text-white",
                )}
                onClick={() => handleThemeChange("light")}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">
                  {t("settings.light")}
                </span>
              </Button>

              <Button
                variant={
                  theme === "dark" ? "default" : "outline"
                }
                className={cn(
                  "flex flex-col items-center gap-2 h-auto py-3",
                  theme === "dark" &&
                    "bg-blue-600 hover:bg-blue-700 text-white",
                )}
                onClick={() => handleThemeChange("dark")}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">
                  {t("settings.dark")}
                </span>
              </Button>

              <Button
                variant={
                  theme === "system" ? "default" : "outline"
                }
                className={cn(
                  "flex flex-col items-center gap-2 h-auto py-3",
                  theme === "system" &&
                    "bg-blue-600 hover:bg-blue-700 text-white",
                )}
                onClick={() => handleThemeChange("system")}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">
                  {t("settings.system")}
                </span>
              </Button>
            </div>
          </div>

          {/* Language Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <h3 className="font-semibold">
                {t("settings.language")}
              </h3>
            </div>

            <LanguageSelector />
          </div>

          {/* Calendar Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="font-semibold">
                {t("settings.calendar")}
              </h3>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label
                  htmlFor="week-start"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {t("settings.weekStartsOnMonday")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {localWeekStartsOnMonday
                    ? t("settings.mondayFirst")
                    : t("settings.sundayFirst")}
                </p>
              </div>
              <Switch
                id="week-start"
                checked={localWeekStartsOnMonday}
                onCheckedChange={handleWeekStartToggle}
              />
            </div>
          </div>

          {/* App Version */}
          <div className="text-center mt-3 pb-1">
            <p className="text-[10px] text-muted-foreground/60">
              Pilliox v{packageJson.version}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}