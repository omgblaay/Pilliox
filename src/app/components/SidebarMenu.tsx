import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  CalendarDays,
  Info,
  Palette,
  Pill,
  Settings as SettingsIcon,
  User,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { cn } from "./ui/utils";

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
  viewMode: "month" | "week";
  onViewModeChange: (mode: "month" | "week") => void;
  onMarkDays: () => void;
  onAbout: () => void;
  userId: string;
}

export function SidebarMenu({
  open,
  onClose,
  viewMode,
  onViewModeChange,
  onMarkDays,
  onAbout,
  userId,
}: SidebarMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Logo />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Menu items */}
            <div className="p-4 flex flex-col items-stretch space-y-1">
              {/* View mode */}
              <Button
                variant="ghost"
                className={cn(
                  "justify-start",
                  viewMode === "week" ? "bg-blue-500/10 text-blue-400" : "",
                )}
                onClick={() => {
                  onViewModeChange("week");
                  onClose();
                }}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("calendar.weekView")}</span>
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  "justify-start",
                  viewMode === "month" ? "bg-blue-500/10 text-blue-400" : "",
                )}
                onClick={() => {
                  onViewModeChange("month");
                  onClose();
                }}
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("calendar.monthView")}</span>
              </Button>

              <div className="h-px bg-border my-2" />

              {/* Mark days */}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onMarkDays();
                  onClose();
                }}
              >
                <Palette className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("calendar.markDays")}</span>
              </Button>

              <div className="h-px bg-border my-2" />

              {/* Navigation */}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => go("/app/profile")}
              >
                <User className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("profile.title")}</span>
              </Button>

              <Button
                variant="ghost"
                className="justify-start"
                disabled={!userId}
                onClick={() => go("/medications")}
              >
                <Pill className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("pillsSettings.title")}</span>
              </Button>

              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => go("/app/settings")}
              >
                <SettingsIcon className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("settings.title")}</span>
              </Button>

              <div className="h-px bg-border my-2" />

              {/* About */}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onAbout();
                  onClose();
                }}
              >
                <Info className="h-5 w-5" />
                <span className="text-[15px] font-medium">{t("about.title")}</span>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
