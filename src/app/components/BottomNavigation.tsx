import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Pill, User, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    {
      id: "calendar",
      path: "/app",
      icon: Calendar,
      label: t("nav.calendar") || "Calendar",
    },
    {
      id: "medications",
      path: "/app/medications",
      icon: Pill,
      label: t("nav.medications") || "Medications",
    },
    {
      id: "profile",
      path: "/app/profile",
      icon: User,
      label: t("nav.profile") || "Profile",
    },
    {
      id: "settings",
      path: "/app/settings",
      icon: Settings,
      label: t("nav.settings") || "Settings",
    },
  ];

  const currentTab =
    tabs.find((tab) => {
      if (tab.path === "/app") {
        return location.pathname === "/app";
      }
      return location.pathname.startsWith(tab.path);
    })?.id || "calendar";

  return (
    <nav className="fixed lg:hidden bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-40">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs mt-1 font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}