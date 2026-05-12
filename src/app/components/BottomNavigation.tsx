import { useLocation, useNavigate } from "react-router";
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
    <nav className="fixed lg:hidden bottom-4 left-12 right-12 flex space-between bg-white/5 border border-white/20 rounded-full backdrop-blur-lg saturate-150 px-4 backdrop-filter bg-opacity-10 safe-area-bottom z-40">

        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col w-full items-center justify-center gap-1 flex-1 h-14 relative"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-b-full"
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
                  className={`size-4 transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2 : 1}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`text-[0.64rem] font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

    </nav>
  );
}