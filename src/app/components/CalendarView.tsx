import { useState, useEffect, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { de } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { pl } from "date-fns/locale/pl";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Droplet,
  Pill,
  Check,
  X,
  Palette,
  Settings as SettingsIcon,
  User,
  Pencil,
  Calendar,
  CalendarDays,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  type PanInfo,
} from "motion/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ProfileSettings } from "./ProfileSettings";
import { AppSettings } from "./AppSettings";
import {
  PillsSettings,
  type PillSetting,
} from "./PillsSettings";
import { cn } from "./ui/utils";
import { useTheme, type Theme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import Vector from "../../imports/Vector";

interface PillDosage {
  pillId: string;
  dosage: number;
}

interface CalendarEntry {
  amount: string;
  note: string;
  pills?: string; // JSON string of PillDosage[]
  color?: string;
  tag?: string;
}

interface CalendarViewProps {
  accessToken: string;
  onLogout: () => void;
  projectId: string;
  anonKey: string;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

const COLORS = [
  {
    name: "Blue",
    value: "bg-blue-100 border-blue-300 text-blue-700",
    dark: "#1E3A8A", // Darker blue for dark mode
    hex: "#DBEAFE",
  },
  {
    name: "Green",
    value: "bg-green-100 border-green-300 text-green-700",
    dark: "#065F46", // Darker green for dark mode
    hex: "#D1FAE5",
  },
  {
    name: "Purple",
    value: "bg-purple-100 border-purple-300 text-purple-700",
    dark: "#6B21A8", // Darker purple for dark mode
    hex: "#F3E8FF",
  },
  {
    name: "Pink",
    value: "bg-pink-100 border-pink-300 text-pink-700",
    dark: "#9F1239", // Darker pink for dark mode
    hex: "#FCE7F3",
  },
  {
    name: "Yellow",
    value: "bg-yellow-100 border-yellow-300 text-yellow-700",
    dark: "#92400E", // Darker yellow/amber for dark mode
    hex: "#FEF3C7",
  },
  {
    name: "Orange",
    value: "bg-orange-100 border-orange-300 text-orange-700",
    dark: "#9A3412", // Darker orange for dark mode
    hex: "#FFEDD5",
  },
  {
    name: "Red",
    value: "bg-red-100 border-red-300 text-red-700",
    dark: "#991B1B", // Darker red for dark mode
    hex: "#FEE2E2",
  },
  {
    name: "Indigo",
    value: "bg-indigo-100 border-indigo-300 text-indigo-700",
    dark: "#3730A3", // Darker indigo for dark mode
    hex: "#E0E7FF",
  },
];

// Helper function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if light (luminance > 0.5)
  return luminance > 0.5;
};

// Helper function to get the appropriate color for the current theme
function getColorForTheme(
  storedColor: string,
  isDarkMode: boolean,
): string {
  if (!isDarkMode) return storedColor;

  // Find if this is a known light color and return its dark variant
  const colorObj = COLORS.find(
    (c) => c.hex.toLowerCase() === storedColor.toLowerCase(),
  );
  return colorObj ? colorObj.dark : storedColor;
}

export function CalendarView({
  accessToken,
  onLogout,
  projectId,
  anonKey,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: CalendarViewProps) {
  const { t, i18n } = useTranslation();

  // Date-fns locale mapping
  const localeMap = {
    en: enUS,
    de: de,
    pl: pl,
  };
  // Extract language code (first 2 chars) to handle cases like 'pl-PL'
  const languageCode = (i18n.language || "en")
    .split("-")[0]
    .toLowerCase();
  const dateLocale =
    localeMap[languageCode as keyof typeof localeMap] || enUS;

  // Helper function to get translated month name
  const getMonthName = (date: Date): string => {
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthIndex = date.getMonth();
    return t(`months.${monthNames[monthIndex]}`);
  };

  // Helper function to format date for dialog title based on language
  const formatDialogDate = (date: Date): string => {
    if (languageCode === "pl") {
      // Polish format: "Poniedziałek, 9. stycznia 2025"
      const formatted = format(date, "EEEE, d. MMMM yyyy", {
        locale: dateLocale,
      });
      // Capitalize first letter
      return (
        formatted.charAt(0).toUpperCase() + formatted.slice(1)
      );
    }
    // Other languages: "Monday, January 9, 2025"
    return format(date, "EEEE, MMMM d, yyyy", {
      locale: dateLocale,
    });
  };

  // Helper function to format header title based on view mode
  const formatHeaderTitle = (date: Date): string => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(date, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      const weekEnd = endOfWeek(date, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });

      // If start and end are in the same month
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${getMonthName(weekStart)} ${format(weekStart, "d", { locale: dateLocale })} - ${format(weekEnd, "d, yyyy", { locale: dateLocale })}`;
      } else {
        // Different months
        return `${getMonthName(weekStart)} ${format(weekStart, "d", { locale: dateLocale })} - ${getMonthName(weekEnd)} ${format(weekEnd, "d, yyyy", { locale: dateLocale })}`;
      }
    } else {
      return `${getMonthName(date)} ${format(date, "yyyy", { locale: dateLocale })}`;
    }
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const prevMonthRef = useRef(new Date());
  const [entries, setEntries] = useState<
    Record<string, CalendarEntry>
  >({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    null,
  );
  const prevSelectedDateRef = useRef<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pills, setPills] = useState<PillDosage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(false);

  // Pills settings
  const [pillsSettings, setPillsSettings] = useState<
    PillSetting[]
  >([]);

  // Multi-select mode
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<
    Set<string>
  >(new Set());
  const [multiSelectDialogOpen, setMultiSelectDialogOpen] =
    useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [multiTag, setMultiTag] = useState("");

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pillsSettingsOpen, setPillsSettingsOpen] =
    useState(false);
  const [weekStartsOnMonday, setWeekStartsOnMonday] =
    useState(true);

  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] =
    useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">(
    "month",
  );

  // User profile
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");

  // Tag editing
  const [editingTag, setEditingTag] = useState(false);
  const [tempTagText, setTempTagText] = useState("");
  const [tempTagColor, setTempTagColor] = useState(COLORS[0]);

  // Theme
  const { theme, setTheme } = useTheme("system");

  // Force re-render when theme changes to update cell colors
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Swipe animation state - use ref for synchronous updates
  const swipeDirectionRef = useRef<number>(0);
  const [, forceUpdate] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragX, setDragX] = useState(0);

  // Animation variants for month/day transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: 300 * direction,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: -300 * direction,
      opacity: 0,
    }),
  };

  const headerSlideVariants = {
    enter: (direction: number) => ({
      x: 100 * direction,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: -100 * direction,
      opacity: 0,
    }),
  };

  // Preload adjacent months for smooth swiping
  const [adjacentMonthEntries, setAdjacentMonthEntries] =
    useState<{
      prev: Record<string, CalendarEntry>;
      next: Record<string, CalendarEntry>;
    }>({ prev: {}, next: {} });

  useEffect(() => {
    // Initial check after theme is applied
    const checkDarkMode = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark"),
      );
    };

    // Check immediately
    checkDarkMode();

    // Set up observer for changes
    const observer = new MutationObserver(checkDarkMode);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  // Health check - test server connectivity
  useEffect(() => {
    const testConnection = async () => {
      try {
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/health`;
        const response = await fetch(healthUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
        });

        if (response.ok) {
          await response.json();
          setServerError(false);
        } else {
          await response.text();
          setServerError(true);
        }
      } catch (error) {
        setServerError(true);
      }
    };
    testConnection();
  }, [projectId, anonKey]);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
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
          setName(data.user.name || "");
          setUserId(data.user.id || "");
        }
      } catch (error) {
        // Error loading user profile
      }
    };

    loadUserProfile();
  }, [accessToken, projectId, anonKey]);

  // Load pills settings
  useEffect(() => {
    const loadPillsSettings = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${anonKey}`,
              "X-User-Token": accessToken,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setPillsSettings(data.pills || []);
        }
      } catch (error) {
        console.error("Error loading pills settings:", error);
      }
    };

    loadPillsSettings();
  }, [
    userId,
    accessToken,
    projectId,
    anonKey,
    pillsSettingsOpen,
  ]); // Reload when settings modal closes

  // Load entries for current month
  useEffect(() => {
    const monthKey = format(currentMonth, "yyyy-MM");
    const fetchEntries = async () => {
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || {});
        } else {
          await response.json();
        }
      } catch (error) {
        setServerError(true);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchEntries();
  }, [currentMonth, accessToken, projectId, anonKey]); // Reload when month changes OR access token changes

  // Preload adjacent months for smooth swiping
  useEffect(() => {
    const fetchAdjacentMonths = async () => {
      const prevMonth = subMonths(currentMonth, 1);
      const nextMonth = addMonths(currentMonth, 1);

      const prevMonthKey = format(prevMonth, "yyyy-MM");
      const nextMonthKey = format(nextMonth, "yyyy-MM");

      try {
        const [prevResponse, nextResponse] = await Promise.all([
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${prevMonthKey}`,
            {
              headers: {
                Authorization: `Bearer ${anonKey}`,
                "X-User-Token": accessToken,
              },
            },
          ),
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${nextMonthKey}`,
            {
              headers: {
                Authorization: `Bearer ${anonKey}`,
                "X-User-Token": accessToken,
              },
            },
          ),
        ]);

        const prevData = prevResponse.ok
          ? await prevResponse.json()
          : { entries: {} };
        const nextData = nextResponse.ok
          ? await nextResponse.json()
          : { entries: {} };

        setAdjacentMonthEntries({
          prev: prevData.entries || {},
          next: nextData.entries || {},
        });
      } catch (error) {
        console.error(
          "Error preloading adjacent months:",
          error,
        );
      }
    };

    fetchAdjacentMonths();
  }, [currentMonth, accessToken, projectId, anonKey]);

  const saveEntries = async (
    newEntries: Record<string, CalendarEntry>,
  ) => {
    try {
      const monthKey = format(currentMonth, "yyyy-MM");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify({ entries: newEntries }),
        },
      );

      if (!response.ok) {
        await response.json();
      }
    } catch (error) {
      // Error saving entries
    }
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;

    const dateKey = format(date, "yyyy-MM-dd");

    if (multiSelectMode) {
      const newSelected = new Set(selectedDates);
      if (newSelected.has(dateKey)) {
        newSelected.delete(dateKey);
      } else {
        newSelected.add(dateKey);
      }
      setSelectedDates(newSelected);
      return;
    }

    setSelectedDate(date);
    const entry = entries[dateKey];
    setAmount(entry?.amount || "");
    setNote(entry?.note || "");

    // Parse pills JSON
    try {
      const pillsData = entry?.pills
        ? JSON.parse(entry.pills)
        : [];
      setPills(Array.isArray(pillsData) ? pillsData : []);
    } catch (error) {
      console.error("Error parsing pills data:", error);
      setPills([]);
    }

    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const newEntries = { ...entries };

    // Serialize pills data
    const pillsJson =
      pills.length > 0 ? JSON.stringify(pills) : "";

    if (amount || note || pillsJson) {
      newEntries[dateKey] = {
        ...newEntries[dateKey],
        amount,
        note,
        pills: pillsJson,
      };
    } else if (
      !newEntries[dateKey]?.color &&
      !newEntries[dateKey]?.tag
    ) {
      delete newEntries[dateKey];
    } else {
      newEntries[dateKey] = {
        ...newEntries[dateKey],
        amount: "",
        note: "",
        pills: "",
      };
    }

    setEntries(newEntries);
    saveEntries(newEntries);
    setDialogOpen(false);
    setAmount("");
    setNote("");
    setPills([]);
  };

  const handleRemoveColorTag = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const newEntries = { ...entries };

    if (newEntries[dateKey]) {
      const { color, tag, ...rest } = newEntries[dateKey];
      if (!rest.amount && !rest.note && !rest.pills) {
        delete newEntries[dateKey];
      } else {
        newEntries[dateKey] = rest;
      }
    }

    setEntries(newEntries);
    saveEntries(newEntries);
    setDeleteConfirmOpen(false);
  };

  const handleRemoveColorTagFromAll = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const currentEntry = entries[dateKey];

    if (!currentEntry?.color) return;

    const colorToRemove = currentEntry.color;
    const tagToRemove = currentEntry.tag;
    const newEntries = { ...entries };

    // Remove color and tag from all days that have the same color and tag
    Object.keys(newEntries).forEach((key) => {
      const entry = newEntries[key];
      if (
        entry.color === colorToRemove &&
        entry.tag === tagToRemove
      ) {
        const { color, tag, ...rest } = entry;
        if (!rest.amount && !rest.note && !rest.pills) {
          delete newEntries[key];
        } else {
          newEntries[key] = rest;
        }
      }
    });

    setEntries(newEntries);
    saveEntries(newEntries);
    setDeleteConfirmOpen(false);
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedDates(new Set());
  };

  const applyMultiSelectColors = () => {
    if (selectedDates.size === 0) return;

    const newEntries = { ...entries };
    selectedDates.forEach((dateKey) => {
      newEntries[dateKey] = {
        ...newEntries[dateKey],
        color: selectedColor.hex,
        tag: multiTag || undefined,
        amount: newEntries[dateKey]?.amount || "",
        note: newEntries[dateKey]?.note || "",
        pills: newEntries[dateKey]?.pills || "",
      };
    });

    setEntries(newEntries);
    saveEntries(newEntries);
    setMultiSelectDialogOpen(false);
    setMultiSelectMode(false);
    setSelectedDates(new Set());
    setMultiTag("");
  };

  const clearMultiSelectColors = () => {
    if (selectedDates.size === 0) return;

    const newEntries = { ...entries };
    selectedDates.forEach((dateKey) => {
      if (newEntries[dateKey]) {
        const { color, tag, ...rest } = newEntries[dateKey];
        if (!rest.amount && !rest.note && !rest.pills) {
          delete newEntries[dateKey];
        } else {
          newEntries[dateKey] = rest;
        }
      }
    });

    setEntries(newEntries);
    saveEntries(newEntries);
    setSelectedDates(new Set());
  };

  const previousMonth = () => {
    if (viewMode === "week") {
      const newWeek = subWeeks(currentMonth, 1);
      swipeDirectionRef.current = -1;
      setCurrentMonth(newWeek);
    } else {
      const newMonth = subMonths(currentMonth, 1);
      swipeDirectionRef.current = -1;
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    if (viewMode === "week") {
      const newWeek = addWeeks(currentMonth, 1);
      swipeDirectionRef.current = 1;
      setCurrentMonth(newWeek);
    } else {
      const newMonth = addMonths(currentMonth, 1);
      swipeDirectionRef.current = 1;
      setCurrentMonth(newMonth);
    }
  };

  // Swipe handlers for calendar month navigation
  const handleCalendarSwipe = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        // Swiped right - go to previous month
        previousMonth();
      } else {
        // Swiped left - go to next month
        nextMonth();
      }
    }
  };

  // Day navigation in dialog
  const navigateToPreviousDay = () => {
    if (!selectedDate) return;
    swipeDirectionRef.current = -1; // Moving backward in time
    const previousDay = subDays(selectedDate, 1);
    setSelectedDate(previousDay);
    const dateKey = format(previousDay, "yyyy-MM-dd");
    const entry = entries[dateKey];
    setAmount(entry?.amount || "");
    setNote(entry?.note || "");

    // Parse pills JSON
    try {
      const pillsData = entry?.pills
        ? JSON.parse(entry.pills)
        : [];
      setPills(Array.isArray(pillsData) ? pillsData : []);
    } catch (error) {
      console.error("Error parsing pills data:", error);
      setPills([]);
    }

    // Update month if we crossed month boundary
    if (!isSameMonth(previousDay, currentMonth)) {
      setCurrentMonth(previousDay);
    }
  };

  const navigateToNextDay = () => {
    if (!selectedDate) return;
    swipeDirectionRef.current = 1; // Moving forward in time
    const nextDay = addDays(selectedDate, 1);
    setSelectedDate(nextDay);
    const dateKey = format(nextDay, "yyyy-MM-dd");
    const entry = entries[dateKey];
    setAmount(entry?.amount || "");
    setNote(entry?.note || "");

    // Parse pills JSON
    try {
      const pillsData = entry?.pills
        ? JSON.parse(entry.pills)
        : [];
      setPills(Array.isArray(pillsData) ? pillsData : []);
    } catch (error) {
      console.error("Error parsing pills data:", error);
      setPills([]);
    }

    // Update month if we crossed month boundary
    if (!isSameMonth(nextDay, currentMonth)) {
      setCurrentMonth(nextDay);
    }
  };

  // Swipe handlers for day modal navigation
  const handleDayModalSwipe = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        // Swiped right - go to previous day
        navigateToPreviousDay();
      } else {
        // Swiped left - go to next day
        navigateToNextDay();
      }
    }
  };

  // Helper functions for UI
  const handlePreviousMonth = previousMonth;
  const handleNextMonth = nextMonth;
  const handleDayClick = handleDateClick;
  const handleMultiSelectStart = () => {
    setMultiSelectMode(true);
    setSelectedDates(new Set());
  };
  const applyColorToSelection = () => {
    if (selectedDates.size > 0) {
      setMultiSelectDialogOpen(true);
    }
  };
  const cancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedDates(new Set());
  };

  // Helper function to find all days with the same color and tag
  const findGroupedDays = (
    currentColor: string,
    currentTag: string,
  ): string[] => {
    return Object.keys(entries).filter((dateKey) => {
      const entry = entries[dateKey];
      return (
        entry.color === currentColor && entry.tag === currentTag
      );
    });
  };

  // Helper function to format grouped days as ranges
  const formatDayRanges = (dateStrings: string[]): string[] => {
    if (dateStrings.length === 0) return [];

    // Sort dates
    const sorted = dateStrings
      .map((ds) => new Date(ds))
      .sort((a, b) => a.getTime() - b.getTime());

    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];

      // Check if consecutive (next day)
      const dayDiff =
        (current.getTime() - prev.getTime()) /
        (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        rangeEnd = current;
      } else {
        // End of range, add it
        if (rangeStart.getTime() === rangeEnd.getTime()) {
          ranges.push(
            format(rangeStart, "MMM d", { locale: dateLocale }),
          );
        } else {
          ranges.push(
            `${format(rangeStart, "MMM d", { locale: dateLocale })} - ${format(rangeEnd, "d", { locale: dateLocale })}`,
          );
        }
        rangeStart = current;
        rangeEnd = current;
      }
    }

    // Add the last range
    if (rangeStart.getTime() === rangeEnd.getTime()) {
      ranges.push(
        format(rangeStart, "MMM d", { locale: dateLocale }),
      );
    } else {
      ranges.push(
        `${format(rangeStart, "MMM d", { locale: dateLocale })} - ${format(rangeEnd, "d", { locale: dateLocale })}`,
      );
    }

    return ranges;
  };

  // Function to update tag for all grouped days
  const updateGroupedTag = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const currentEntry = entries[dateKey];
    if (!currentEntry?.color || !currentEntry?.tag) return;

    // Find all days with the same color and tag
    const groupedDays = findGroupedDays(
      currentEntry.color,
      currentEntry.tag,
    );

    // Update all grouped days
    const newEntries = { ...entries };
    groupedDays.forEach((dayKey) => {
      newEntries[dayKey] = {
        ...newEntries[dayKey],
        tag: tempTagText,
        color: tempTagColor.hex,
      };
    });

    setEntries(newEntries);
    saveEntries(newEntries);
    setEditingTag(false);
  };

  // Function to start editing tag
  const startEditingTag = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const currentEntry = entries[dateKey];
    if (!currentEntry?.color) return;

    setTempTagText(currentEntry.tag || "");
    // Find the color object from the hex value
    const colorObj = COLORS.find(
      (c) =>
        c.hex.toLowerCase() ===
        currentEntry.color.toLowerCase(),
    );
    setTempTagColor(colorObj || COLORS[0]);
    setEditingTag(true);
  };

  // Calculate days based on view mode
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  let daysInView: Date[];
  let emptyDays: null[] = [];

  if (viewMode === "week") {
    // Week view: show only current week
    const weekStart = startOfWeek(currentMonth, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });
    const weekEnd = endOfWeek(currentMonth, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });
    daysInView = eachDayOfInterval({
      start: weekStart,
      end: weekEnd,
    });
  } else {
    // Month view: show all days in month
    daysInView = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    // Calculate empty days based on week start preference
    let dayOffset = monthStart.getDay();
    if (weekStartsOnMonday) {
      dayOffset = dayOffset === 0 ? 6 : dayOffset - 1;
    }
    emptyDays = Array(dayOffset).fill(null);
  }

  // Keep backward compatibility
  const daysInMonth = daysInView;

  // Day headers based on week start preference
  const dayHeaders = weekStartsOnMonday
    ? [
        t("days.mon"),
        t("days.tue"),
        t("days.wed"),
        t("days.thu"),
        t("days.fri"),
        t("days.sat"),
        t("days.sun"),
      ]
    : [
        t("days.sun"),
        t("days.mon"),
        t("days.tue"),
        t("days.wed"),
        t("days.thu"),
        t("days.fri"),
        t("days.sat"),
      ];

  return (
    <div className="h-full bg-background relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-blue-400"></div>
            <p className="mt-3 text-white font-medium text-sm">
              {t("calendar.loading")}
            </p>
          </div>
        </div>
      )}

      {/* Server Error Banner */}
      {serverError && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 z-50 text-center text-sm">
          <p className="font-medium">
            ⚠️ Server Connection Error
          </p>
          <p className="text-xs mt-1 opacity-90">
            Unable to connect to the backend server. Check
            console for details.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="max-w-md lg:max-w-[800px] mx-auto px-4 sm:px-[24px] py-4 sm:py-[20px]">
          <div className="flex items-center gap-8 justify-between mt-[0px] mr-[0px] ml-[0px] m-[0px]">
            <div className="flex items-start flex-col gap-2">
              <div className="h-[28px] w-[120px]">
                <Vector />
              </div>
              <p className="text-[14px] text-muted-foreground">
                {t("app.welcome", { name })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-accent"
                onClick={() => {
                  if (userId) {
                    setPillsSettingsOpen(true);
                  } else {
                    console.error(
                      "Cannot open pills settings: userId not loaded yet",
                    );
                  }
                }}
                title="Medication Settings"
                disabled={!userId}
              >
                <Pill className="h-6 w-6 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-accent"
                onClick={() => setProfileOpen(true)}
              >
                <User className="h-7 w-7 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-accent"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon className="h-[42px] w-[42px] text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md lg:max-w-[800px] mx-auto px-4">
        {/* Calendar Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Month/Week Navigation */}
          <div className="p-[12px] border-b border-border px-[12px] py-[8px]">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Mark Days Button */}
              <Button
                onClick={handleMultiSelectStart}
                variant="outline"
                size="sm"
                disabled={multiSelectMode}
                className="shrink-0 flex-0"
              >
                <Palette className="h-3 w-3" />
                {t("calendar.markDays")}
              </Button>

              {/* Center: Date Navigation */}
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousMonth}
                  className="h-10 w-10 rounded-full hover:bg-accent shrink-0"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </Button>
                <motion.div
                  className="overflow-hidden relative"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleCalendarSwipe}
                >
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                    custom={swipeDirectionRef.current}
                  >
                    <motion.h2
                      key={format(currentMonth, "yyyy-MM-ww")}
                      custom={swipeDirectionRef.current}
                      variants={headerSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className="text-lg font-semibold text-foreground text-[14px] text-center whitespace-nowrap"
                    >
                      {formatHeaderTitle(currentMonth)}
                    </motion.h2>
                  </AnimatePresence>
                </motion.div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-10 w-10 rounded-full hover:bg-accent shrink-0"
                >
                  <ChevronRight className="h-5 w-5 text-foreground" />
                </Button>
              </div>

              {/* Right: Weekly/Monthly Preview Dropdown */}
              <Button
                variant="ghost"
                onClick={() =>
                  setViewMode(
                    viewMode === "month" ? "week" : "month",
                  )
                }
                className="h-10 px-3 flex-0 rounded-full hover:bg-accent shrink-0 flex items-center gap-1.5"
                title={
                  viewMode === "month"
                    ? t("calendar.weekView")
                    : t("calendar.monthView")
                }
              >
                <span className="text-sm font-medium text-foreground">
                  {viewMode === "month"
                    ? t("calendar.weeklyPreview")
                    : t("calendar.monthlyPreview")}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          </div>

          {/* Multi-select Controls */}
          {multiSelectMode && (
            <div className="px-4 sm:px-6 py-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-100 dark:border-blue-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t("multiSelect.daysSelected", {
                      count: selectedDates.size,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={applyColorToSelection}
                    disabled={selectedDates.size === 0}
                    className="flex-1"
                  >
                    <Check className="h-2 w-2" />
                    {t("multiSelect.apply")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelMultiSelect}
                    className="flex-1"
                  >
                    <X className="h-2 w-2" />
                    {t("calendar.cancel")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <motion.div
            className="px-4 sm:px-6 py-4 sm:py-5"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleCalendarSwipe}
          >
            {/* Day Headers - Only for Month View */}
            {viewMode === "month" && (
              <div className="grid grid-cols-7 gap-2.5 mb-4">
                {dayHeaders.map((day) => (
                  <div key={day} className="text-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Days Grid */}
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={swipeDirectionRef.current}
            >
              <motion.div
                key={
                  viewMode === "week"
                    ? format(currentMonth, "yyyy-ww")
                    : format(currentMonth, "yyyy-MM")
                }
                custom={swipeDirectionRef.current}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className={
                  viewMode === "week"
                    ? "flex flex-col gap-2"
                    : "grid grid-cols-7 gap-y-2"
                }
              >
                {/* Empty days for month view only */}
                {viewMode === "month" &&
                  emptyDays.map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-full h-18"
                    />
                  ))}
                {daysInMonth.map((day, dayIndex) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const entry = entries[dateStr] || {};
                  const hasAmount =
                    entry.amount && entry.amount !== "";
                  const hasNote =
                    entry.note && entry.note !== "";
                  const hasPills =
                    entry.pills &&
                    entry.pills !== "" &&
                    entry.pills !== "[]";
                  const hasColor =
                    entry.color && entry.color !== "";
                  const isSelected = selectedDates.has(dateStr);
                  const isToday = isSameDay(day, new Date());

                  // Get appropriate color for current theme
                  const displayColor = hasColor
                    ? getColorForTheme(entry.color, isDarkMode)
                    : undefined;

                  // Calculate position in week (0 = first day, 6 = last day based on week start preference)
                  const gridIndex = emptyDays.length + dayIndex;
                  const positionInWeek = gridIndex % 7;
                  const isFirstDayOfWeek = positionInWeek === 0;
                  const isLastDayOfWeek = positionInWeek === 6;

                  // Check if previous and next days have the same color and tag
                  const prevDay =
                    dayIndex > 0
                      ? daysInMonth[dayIndex - 1]
                      : null;
                  const nextDay =
                    dayIndex < daysInMonth.length - 1
                      ? daysInMonth[dayIndex + 1]
                      : null;

                  const prevDateStr = prevDay
                    ? format(prevDay, "yyyy-MM-dd")
                    : null;
                  const nextDateStr = nextDay
                    ? format(nextDay, "yyyy-MM-dd")
                    : null;

                  const prevEntry = prevDateStr
                    ? entries[prevDateStr]
                    : null;
                  const nextEntry = nextDateStr
                    ? entries[nextDateStr]
                    : null;

                  const hasSameColorTagAsPrev =
                    !isFirstDayOfWeek &&
                    prevEntry &&
                    hasColor &&
                    prevEntry.color === entry.color &&
                    prevEntry.tag === entry.tag;

                  const hasSameColorTagAsNext =
                    !isLastDayOfWeek &&
                    nextEntry &&
                    hasColor &&
                    nextEntry.color === entry.color &&
                    nextEntry.tag === entry.tag;

                  // Check if this day is part of a tagged group (for margin-top)
                  const isPartOfTaggedGroup =
                    hasColor &&
                    entry.tag &&
                    (hasSameColorTagAsPrev ||
                      hasSameColorTagAsNext ||
                      (!hasSameColorTagAsPrev &&
                        !hasSameColorTagAsNext));

                  // Count consecutive days with same color and tag (for tag width calculation)
                  let consecutiveDaysCount = 1;
                  if (
                    hasColor &&
                    entry.tag &&
                    !hasSameColorTagAsPrev
                  ) {
                    let checkIndex = dayIndex + 1;
                    while (checkIndex < daysInMonth.length) {
                      const checkDay = daysInMonth[checkIndex];
                      const checkDateStr = format(
                        checkDay,
                        "yyyy-MM-dd",
                      );
                      const checkEntry = entries[checkDateStr];
                      const checkGridIndex =
                        emptyDays.length + checkIndex;
                      const checkPositionInWeek =
                        checkGridIndex % 7;
                      const isCheckLastDayOfWeek =
                        checkPositionInWeek === 6;

                      // Check if same color/tag and not crossing week boundary
                      if (
                        checkEntry?.color === entry.color &&
                        checkEntry?.tag === entry.tag
                      ) {
                        consecutiveDaysCount++;
                        // Stop if the day we just counted is the last day of the week
                        if (isCheckLastDayOfWeek) {
                          break;
                        }
                        checkIndex++;
                      } else {
                        break;
                      }
                    }
                  }

                  // Determine border radius based on grouping
                  let roundedClass = "rounded-xl";
                  if (
                    hasColor &&
                    (hasSameColorTagAsPrev ||
                      hasSameColorTagAsNext)
                  ) {
                    if (
                      hasSameColorTagAsPrev &&
                      hasSameColorTagAsNext
                    ) {
                      // Middle of a group
                      roundedClass = "rounded-none";
                    } else if (
                      hasSameColorTagAsPrev &&
                      !hasSameColorTagAsNext
                    ) {
                      // End of a group
                      roundedClass =
                        "rounded-r-xl rounded-l-none";
                    } else if (
                      !hasSameColorTagAsPrev &&
                      hasSameColorTagAsNext
                    ) {
                      // Start of a group
                      roundedClass =
                        "rounded-l-xl rounded-r-none";
                    }
                  }

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        viewMode === "week"
                          ? "w-full min-h-[60px] flex flex-row"
                          : "w-full min-h-18",
                        "relative transition-all duration-200",
                        viewMode === "week"
                          ? "rounded-xl"
                          : roundedClass,
                        viewMode === "month" &&
                          "flex flex-col items-center justify-center p-2",
                        viewMode === "week" &&
                          "items-center justify-start p-3 gap-3",
                        "focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-1",
                        isToday &&
                          !hasColor &&
                          "bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 dark:border-blue-600",
                        !isToday &&
                          !hasColor &&
                          "hover:bg-gray-200 dark:hover:bg-accent border-2 border-transparent",
                        hasColor &&
                          "hover:opacity-80 border-2 border-transparent",
                        isSelected &&
                          "ring-2 ring-blue-600 ring-offset-2",
                        // Add z-index for first day of tagged group to keep tag on top
                        hasColor &&
                          entry.tag &&
                          !hasSameColorTagAsPrev &&
                          "z-40",
                      )}
                      style={
                        displayColor
                          ? {
                              backgroundColor: displayColor,
                            }
                          : undefined
                      }
                    >
                      {/* Week view: Inline layout */}
                      {viewMode === "week" ? (
                        <div className="flex items-center gap-3 w-full">
                          {/* Day name and number */}
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {format(day, "EEE", {
                                locale: dateLocale,
                              })}
                            </span>
                            <span
                              className={cn(
                                "text-lg font-bold leading-none",
                                isToday &&
                                  !hasColor &&
                                  "text-blue-600 dark:text-blue-400",
                                !isToday &&
                                  !hasColor &&
                                  "text-gray-700 dark:text-gray-300",
                                hasColor &&
                                  "text-gray-900 dark:text-gray-300",
                              )}
                            >
                              {format(day, "d")}
                            </span>
                          </div>

                          {/* Tag Display */}
                          {hasColor && entry.tag && (
                            <div
                              className={cn(
                                "text-xs font-semibold px-2 py-1 rounded",
                                hasColor && !isDarkMode
                                  ? "bg-black/20 text-gray-900"
                                  : hasColor && isDarkMode
                                    ? "bg-white/20 text-gray-300"
                                    : "",
                              )}
                              title={entry.tag}
                            >
                              {entry.tag}
                            </div>
                          )}

                          {/* Data container */}
                          <div className="flex items-center gap-2 ml-auto flex-wrap">
                            {/* Individual Medications Display */}
                            {hasPills &&
                              (() => {
                                const pillsData: PillDosage[] =
                                  JSON.parse(
                                    entry.pills || "[]",
                                  );
                                return pillsData.map((pill) => {
                                  const pillSetting =
                                    pillsSettings.find(
                                      (ps) =>
                                        ps.id === pill.pillId,
                                    );
                                  if (!pillSetting) return null;

                                  return (
                                    <div
                                      key={pill.pillId}
                                      className={cn(
                                        "flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded whitespace-nowrap",
                                        hasColor && !isDarkMode
                                          ? "bg-black/20 text-gray-900"
                                          : hasColor &&
                                              isDarkMode
                                            ? "bg-white/20 text-gray-300"
                                            : !isDarkMode
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-purple-900 text-purple-100",
                                      )}
                                    >
                                      {pillSetting.color && (
                                        <div
                                          className="h-2.5 w-2.5 rounded-full border border-current"
                                          style={{
                                            backgroundColor:
                                              pillSetting.color,
                                          }}
                                        />
                                      )}
                                      {pillSetting.type ===
                                      "pills" ? (
                                        <>
                                          <Pill className="h-3 w-3" />
                                          <span>
                                            {pillSetting.name.substring(
                                              0,
                                              3,
                                            )}
                                            : {pill.dosage}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Droplet className="h-3 w-3" />
                                          <span>
                                            {pillSetting.name.substring(
                                              0,
                                              3,
                                            )}
                                            : {pill.dosage}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  );
                                });
                              })()}

                            {/* Legacy INR Display - Only show if no pills data */}
                            {hasAmount && !hasPills && (
                              <div
                                className={cn(
                                  "text-xs font-semibold px-2 py-1 rounded whitespace-nowrap",
                                  hasColor && !isDarkMode
                                    ? "bg-black/20 text-gray-900"
                                    : hasColor && isDarkMode
                                      ? "bg-white/20 text-gray-300"
                                      : !isDarkMode
                                        ? "bg-green-100 text-green-700"
                                        : "bg-green-900 text-green-100",
                                )}
                              >
                                INR:{" "}
                                {parseFloat(
                                  entry.amount,
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            )}

                            {/* Note Indicator */}
                            {hasNote && (
                              <span
                                className={cn(
                                  "inline-block w-2 h-2 rounded-full",
                                  hasColor && !isDarkMode
                                    ? "bg-gray-900/80"
                                    : hasColor && isDarkMode
                                      ? "bg-gray-300"
                                      : !isDarkMode
                                        ? "bg-blue-500"
                                        : "bg-blue-400",
                                )}
                                title="Has note"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Month view: Column layout */
                        <div
                          className={cn(
                            "flex flex-col items-center justify-center gap-1",
                            isPartOfTaggedGroup && "mt-5",
                          )}
                        >
                          {/* Tag Display - Show only once per consecutive group at the top center of first day */}
                          {hasColor &&
                            entry.tag &&
                            !hasSameColorTagAsPrev && (
                              <div
                                className={cn(
                                  "absolute top-0 left-0 text-[10px] font-semibold py-0.5 rounded-t-xl truncate z-50 text-left pl-2",
                                  hasColor && !isDarkMode
                                    ? "bg-black/20 text-gray-900"
                                    : hasColor && isDarkMode
                                      ? "bg-white/20 text-gray-300"
                                      : "",
                                )}
                                style={{
                                  width:
                                    consecutiveDaysCount > 1
                                      ? `calc(${consecutiveDaysCount * 100}% + ${(consecutiveDaysCount - 1) * 3}px)`
                                      : "100%",
                                }}
                                title={entry.tag}
                              >
                                {entry.tag}
                              </div>
                            )}

                          {/* Day Number */}
                          <span
                            className={cn(
                              "text-sm font-semibold leading-none",
                              isToday &&
                                !hasColor &&
                                "text-blue-600 dark:text-blue-400",
                              !isToday &&
                                !hasColor &&
                                "text-gray-700 dark:text-gray-300",
                              hasColor &&
                                "text-gray-900 dark:text-gray-300",
                            )}
                          >
                            {format(day, "d")}
                            {/* Note Indicator - Show next to day number when note exists */}
                            {hasNote && (
                              <span
                                className={cn(
                                  "inline-block w-1.5 h-1.5 rounded-full ml-1 align-middle",
                                  hasColor && !isDarkMode
                                    ? "bg-gray-900/80"
                                    : hasColor && isDarkMode
                                      ? "bg-gray-300"
                                      : !isDarkMode
                                        ? "bg-blue-500"
                                        : "bg-blue-400",
                                )}
                              />
                            )}
                          </span>

                          {/* Individual Medications Display */}
                          {hasPills &&
                            (() => {
                              const pillsData: PillDosage[] =
                                JSON.parse(entry.pills || "[]");
                              return pillsData.map((pill) => {
                                const pillSetting =
                                  pillsSettings.find(
                                    (ps) =>
                                      ps.id === pill.pillId,
                                  );
                                if (!pillSetting) return null;

                                return (
                                  <div
                                    key={pill.pillId}
                                    className={cn(
                                      "flex items-center gap-1 text-[10px] font-semibold px-1 py-0.5 rounded",
                                      hasColor && !isDarkMode
                                        ? "bg-black/20 text-gray-900"
                                        : hasColor && isDarkMode
                                          ? "bg-white/20 text-gray-300"
                                          : !isDarkMode
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-purple-900 text-purple-100",
                                    )}
                                  >
                                    {pillSetting.color && (
                                      <div
                                        className="h-2 w-2 rounded-full border border-current"
                                        style={{
                                          backgroundColor:
                                            pillSetting.color,
                                        }}
                                      />
                                    )}
                                    {pillSetting.type ===
                                    "pills" ? (
                                      <Pill className="h-2.5 w-2.5" />
                                    ) : (
                                      <Droplet className="h-2.5 w-2.5" />
                                    )}
                                    <span>
                                      {pillSetting.name.substring(
                                        0,
                                        3,
                                      )}
                                      : {pill.dosage}
                                    </span>
                                  </div>
                                );
                              });
                            })()}

                          {/* Legacy INR Display - Only show if no pills data */}
                          {hasAmount && !hasPills && (
                            <div
                              className={cn(
                                "text-[10px] font-semibold px-1 py-0.5 rounded whitespace-nowrap",
                                hasColor && !isDarkMode
                                  ? "bg-black/20 text-gray-900"
                                  : hasColor && isDarkMode
                                    ? "bg-white/20 text-gray-300"
                                    : !isDarkMode
                                      ? "bg-green-100 text-green-700"
                                      : "bg-green-900 text-green-100",
                              )}
                            >
                              INR:
                              {parseFloat(
                                entry.amount,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Single Day Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-card border-border">
          {/* Header */}
          <DialogHeader className="px-6 py-5 to-card">
            <DialogTitle className="text-foreground">
              {t("calendar.day", {
                count: selectedDates.size,
              })}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("day.editEntry")}
            </DialogDescription>
          </DialogHeader>
          <div className="px-[24px] py-[8px] bg-accent to-card border-t border-b border-border">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateToPreviousDay}
                  className="h-8 w-8 rounded-full hover:bg-accent flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </Button>
                <motion.div
                  className="flex-1 overflow-hidden"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDayModalSwipe}
                >
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                    custom={swipeDirectionRef.current}
                  >
                    <motion.div
                      key={
                        selectedDate
                          ? format(selectedDate, "yyyy-MM-dd")
                          : "none"
                      }
                      custom={swipeDirectionRef.current}
                      variants={headerSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className="text-l font-bold text-foreground text-[14px] text-center flex-1 font-normal"
                    >
                      {selectedDate &&
                        formatDialogDate(selectedDate)}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateToNextDay}
                  className="h-8 w-8 rounded-full hover:bg-accent flex-shrink-0"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <motion.div
            className="px-6 py-5 space-y-5 bg-card"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDayModalSwipe}
          >
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={swipeDirectionRef.current}
            >
              <motion.div
                key={
                  selectedDate
                    ? format(selectedDate, "yyyy-MM-dd")
                    : "none"
                }
                custom={swipeDirectionRef.current}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              >
                {/* Color/Tag Section - Show if day has a color */}
                {selectedDate &&
                  entries[format(selectedDate, "yyyy-MM-dd")]
                    ?.color && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Palette className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                          </div>
                          <Label>
                            {t("calendar.colorTag")}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteConfirmOpen(true)
                            }
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex-1"
                          >
                            <X className="h-2 w-2" />
                            {t("calendar.removeTag")}
                          </Button>
                        </div>
                      </div>

                      {!editingTag ? (
                        <>
                          {/* Tag Display */}
                          <div
                            className="min-h-12 rounded-lg border flex flex-col justify-center px-4 py-2 relative group"
                            style={{
                              backgroundColor: entries[
                                format(
                                  selectedDate,
                                  "yyyy-MM-dd",
                                )
                              ]?.color
                                ? getColorForTheme(
                                    entries[
                                      format(
                                        selectedDate,
                                        "yyyy-MM-dd",
                                      )
                                    ].color,
                                    isDarkMode,
                                  )
                                : undefined,
                              borderColor: entries[
                                format(
                                  selectedDate,
                                  "yyyy-MM-dd",
                                )
                              ]?.color
                                ? getColorForTheme(
                                    entries[
                                      format(
                                        selectedDate,
                                        "yyyy-MM-dd",
                                      )
                                    ].color,
                                    isDarkMode,
                                  )
                                : undefined,
                            }}
                          >
                            <span
                              className="text-sm font-semibold pr-10"
                              style={{
                                color:
                                  entries[
                                    format(
                                      selectedDate,
                                      "yyyy-MM-dd",
                                    )
                                  ]?.color &&
                                  isLightColor(
                                    getColorForTheme(
                                      entries[
                                        format(
                                          selectedDate,
                                          "yyyy-MM-dd",
                                        )
                                      ].color,
                                      isDarkMode,
                                    ),
                                  )
                                    ? "#111827"
                                    : "#f3f4f6",
                              }}
                            >
                              {entries[
                                format(
                                  selectedDate,
                                  "yyyy-MM-dd",
                                )
                              ]?.tag || t("calendar.noTag")}
                            </span>

                            {/* Grouped Days List */}
                            {(() => {
                              const currentEntry =
                                entries[
                                  format(
                                    selectedDate,
                                    "yyyy-MM-dd",
                                  )
                                ];
                              if (
                                !currentEntry?.color ||
                                !currentEntry?.tag
                              )
                                return null;

                              const groupedDays =
                                findGroupedDays(
                                  currentEntry.color,
                                  currentEntry.tag,
                                );
                              const dayRanges =
                                formatDayRanges(groupedDays);

                              if (groupedDays.length <= 1)
                                return null;

                              const textColor =
                                currentEntry.color &&
                                isLightColor(
                                  getColorForTheme(
                                    currentEntry.color,
                                    isDarkMode,
                                  ),
                                )
                                  ? "#6b7280"
                                  : "#d1d5db";

                              return (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1.5 pr-10">
                                  <span
                                    className="font-medium opacity-80"
                                    style={{ color: textColor }}
                                  >
                                    Marked days:
                                  </span>
                                  {dayRanges.map(
                                    (range, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                                        style={{
                                          backgroundColor:
                                            currentEntry.color &&
                                            isLightColor(
                                              getColorForTheme(
                                                currentEntry.color,
                                                isDarkMode,
                                              ),
                                            )
                                              ? "rgba(0,0,0,0.1)"
                                              : "rgba(255,255,255,0.2)",
                                          color: textColor,
                                        }}
                                      >
                                        {range}
                                      </span>
                                    ),
                                  )}
                                </div>
                              );
                            })()}

                            {/* Edit Icon Button */}
                            <button
                              onClick={startEditingTag}
                              className="absolute right-2 top-2 h-8 w-8 rounded-lg flex items-center justify-center group-hover:opacity-100 transition-opacity hover:bg-white/20"
                              style={{
                                color:
                                  entries[
                                    format(
                                      selectedDate,
                                      "yyyy-MM-dd",
                                    )
                                  ]?.color &&
                                  isLightColor(
                                    getColorForTheme(
                                      entries[
                                        format(
                                          selectedDate,
                                          "yyyy-MM-dd",
                                        )
                                      ].color,
                                      isDarkMode,
                                    ),
                                  )
                                    ? "#111827"
                                    : "#f3f4f6",
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Tag Edit Mode */}
                          <div className="space-y-3 flex flex-col gap-2 p-4 rounded-lg bg-accent">
                            <Label
                              htmlFor="days-selection"
                              className="text-foreground"
                            >
                              {t("multiSelect.tagLabel")}
                            </Label>
                            <Input
                              id="days-selection"
                              value={tempTagText}
                              onChange={(e) =>
                                setTempTagText(e.target.value)
                              }
                              placeholder="Tag"
                              maxLength={50}
                            />

                            {/* Color Picker */}
                            <div className="grid grid-cols-4 gap-2">
                              {COLORS.map((color) => (
                                <Button
                                  key={color.name}
                                  onClick={() =>
                                    setTempTagColor(color)
                                  }
                                  className={cn(
                                    "h-10 rounded-lg border-2 transition-all",
                                    tempTagColor.name ===
                                      color.name &&
                                      "ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 dark:ring-offset-card",
                                  )}
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? color.dark
                                      : color.hex,
                                    borderColor: isDarkMode
                                      ? color.dark
                                      : color.hex,
                                  }}
                                >
                                  {tempTagColor.name ===
                                    color.name && (
                                    <Check
                                      className="h-4 w-4 mx-auto"
                                      style={{
                                        color: isLightColor(
                                          isDarkMode
                                            ? color.dark
                                            : color.hex,
                                        )
                                          ? "#111827"
                                          : "#f3f4f6",
                                      }}
                                    />
                                  )}
                                </Button>
                              ))}
                            </div>

                            {/* Edit Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  setEditingTag(false)
                                }
                                className="flex-1"
                                size="sm"
                              >
                                <X className="h-3 w-3 mr-1" />
                                {t("calendar.cancel")}
                              </Button>
                              <Button
                                onClick={updateGroupedTag}
                                size="sm"
                                className="flex-1"
                              >
                                <Check className="h-2 w-2 mr-1" />
                                {t("calendar.apply")}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                <div className="space-y-5">
                  {/* Pills Section - Pills Counter Type */}
                  {pillsSettings.filter(
                    (ps) => (ps.type || "pills") === "pills",
                  ).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Pill className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                        </div>
                        <Label>{t("calendar.pills")}</Label>
                      </div>

                      <div className="space-y-2">
                        {pillsSettings
                          .filter(
                            (ps) =>
                              (ps.type || "pills") === "pills",
                          )
                          .map((pillSetting) => {
                            const pillDosage = pills.find(
                              (p) =>
                                p.pillId === pillSetting.id,
                            );
                            const isSelected = !!pillDosage;
                            const currentDosage =
                              pillDosage?.dosage ||
                              pillSetting.defaultDosage;

                            return (
                              <div
                                key={pillSetting.id}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                              >
                                {/* Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      // Remove pill
                                      setPills(
                                        pills.filter(
                                          (p) =>
                                            p.pillId !==
                                            pillSetting.id,
                                        ),
                                      );
                                    } else {
                                      // Add pill with default dosage
                                      setPills([
                                        ...pills,
                                        {
                                          pillId:
                                            pillSetting.id,
                                          dosage:
                                            pillSetting.defaultDosage,
                                        },
                                      ]);
                                    }
                                  }}
                                  className={cn(
                                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                    isSelected
                                      ? "bg-purple-600 border-purple-600"
                                      : "border-gray-300 dark:border-gray-600",
                                  )}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </button>

                                {/* Color indicator */}
                                {pillSetting.color && (
                                  <div
                                    className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                                    style={{
                                      backgroundColor:
                                        pillSetting.color,
                                    }}
                                  />
                                )}

                                {/* Pill name */}
                                <span
                                  className={cn(
                                    "flex-1 text-sm font-medium",
                                    !isSelected &&
                                      "text-muted-foreground",
                                  )}
                                >
                                  {pillSetting.name}
                                </span>

                                {/* Dosage input */}
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={currentDosage}
                                    onChange={(e) => {
                                      const newDosage =
                                        parseFloat(
                                          e.target.value,
                                        ) || 0;
                                      // If not selected, add the pill first
                                      if (!isSelected) {
                                        setPills([
                                          ...pills,
                                          {
                                            pillId:
                                              pillSetting.id,
                                            dosage: newDosage,
                                          },
                                        ]);
                                      } else {
                                        setPills(
                                          pills.map((p) =>
                                            p.pillId ===
                                            pillSetting.id
                                              ? {
                                                  ...p,
                                                  dosage:
                                                    newDosage,
                                                }
                                              : p,
                                          ),
                                        );
                                      }
                                    }}
                                    className="w-20 h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {t("calendar.pillsUnit")}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Value Type Medications */}
                  {pillsSettings
                    .filter((ps) => ps.type === "value")
                    .map((valueSetting) => {
                      const pillDosage = pills.find(
                        (p) => p.pillId === valueSetting.id,
                      );
                      const currentValue =
                        pillDosage?.dosage?.toString() || "";

                      return (
                        <div
                          key={valueSetting.id}
                          className="flex flex-row items-center justify-center gap-4 space-between"
                        >
                          <div className="flex items-center flex-row gap-2 flex-1">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor:
                                  valueSetting.color
                                    ? `${valueSetting.color}20`
                                    : "#dcfce7",
                              }}
                            >
                              <Droplet
                                className="h-4 w-4"
                                style={{
                                  color:
                                    valueSetting.color ||
                                    "#16a34a",
                                }}
                              />
                            </div>
                            <Label
                              htmlFor={`value-${valueSetting.id}`}
                            >
                              {valueSetting.name}
                            </Label>
                          </div>
                          <Input
                            id={`value-${valueSetting.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="flex-1"
                            value={currentValue}
                            onChange={(e) => {
                              const newValue =
                                parseFloat(e.target.value) || 0;
                              const existingPill = pills.find(
                                (p) =>
                                  p.pillId === valueSetting.id,
                              );
                              if (existingPill) {
                                setPills(
                                  pills.map((p) =>
                                    p.pillId === valueSetting.id
                                      ? {
                                          ...p,
                                          dosage: newValue,
                                        }
                                      : p,
                                  ),
                                );
                              } else {
                                setPills([
                                  ...pills,
                                  {
                                    pillId: valueSetting.id,
                                    dosage: newValue,
                                  },
                                ]);
                              }
                            }}
                          />
                        </div>
                      );
                    })}

                  {/* Legacy INR Section - Only show if no medications configured */}
                  {pillsSettings.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Droplet className="h-4 w-4 text-green-700 dark:text-green-400" />
                        </div>
                        <Label htmlFor="amount">INR</Label>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) =>
                          setAmount(e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Note Section */}
                <div className="space-y-3">
                  <div className="flex items-center pt-4 gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-blue-700 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <Label htmlFor="note">
                      {t("calendar.note")}
                    </Label>
                  </div>
                  <Textarea
                    id="note"
                    placeholder={t("day.notePlaceholder")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
                {/* Footer Actions */}
                <div className="flex gap-3 mt-4">
                  {entries[
                    selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : ""
                  ] && (
                    <Button
                      onClick={() => setDeleteConfirmOpen(true)}
                      variant="destructive"
                      className="flex-0"
                    >
                      {t("day.delete")}
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                  >
                    {t("day.saveChanges")}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Multi-select Color Dialog */}
      <Dialog
        open={multiSelectDialogOpen}
        onOpenChange={setMultiSelectDialogOpen}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t("multiSelect.title", {
                count: selectedDates.size,
              })}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("multiSelect.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected Days Display */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">
                {t("multiSelect.selectedDays")}
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border max-h-32 overflow-y-auto">
                {Array.from(selectedDates)
                  .sort()
                  .map((dateStr) => (
                    <Badge
                      key={dateStr}
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      {format(new Date(dateStr), "MMM d", {
                        locale: dateLocale,
                      })}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                {t("multiSelect.selectColor")}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "h-12 rounded-lg border-2 transition-all",
                      selectedColor.name === color.name &&
                        "ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 dark:ring-offset-card",
                    )}
                    style={{
                      backgroundColor: isDarkMode
                        ? color.dark
                        : color.hex,
                      borderColor: isDarkMode
                        ? color.dark
                        : color.hex,
                    }}
                  >
                    {selectedColor.name === color.name && (
                      <Check
                        className="h-5 w-5 mx-auto"
                        style={{
                          color: isLightColor(
                            isDarkMode ? color.dark : color.hex,
                          )
                            ? "#111827"
                            : "#f3f4f6",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="multi-tag"
                className="text-foreground"
              >
                {t("multiSelect.tagLabel")}
              </Label>
              <Input
                id="multi-tag"
                placeholder={t("multiSelect.tagPlaceholder")}
                value={multiTag}
                onChange={(e) => setMultiTag(e.target.value)}
                maxLength={20}
                className="bg-input-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <Button
            onClick={applyMultiSelectColors}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            {t("calendar.apply")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Modal */}
      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
        accessToken={accessToken}
        projectId={projectId}
        anonKey={anonKey}
        onLogout={onLogout}
        onNavigateToTerms={onNavigateToTerms}
        onNavigateToPrivacy={onNavigateToPrivacy}
      />

      {/* App Settings Modal */}
      <AppSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        accessToken={accessToken}
        projectId={projectId}
        anonKey={anonKey}
        theme={theme}
        onThemeChange={setTheme}
        weekStartsOnMonday={weekStartsOnMonday}
        onWeekStartChange={setWeekStartsOnMonday}
      />

      {/* Pills Settings Modal */}
      <PillsSettings
        open={pillsSettingsOpen}
        onOpenChange={setPillsSettingsOpen}
        userId={userId}
        accessToken={accessToken}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t("deleteConfirm.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("deleteConfirm.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={handleRemoveColorTag}
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
            >
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="font-semibold">
                  {t("deleteConfirm.thisDay")}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t("deleteConfirm.thisDayDescription")}
                </span>
              </div>
            </Button>

            <Button
              onClick={handleRemoveColorTagFromAll}
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
            >
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="font-semibold">
                  {t("deleteConfirm.allDays")}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t("deleteConfirm.allDaysDescription")}
                </span>
              </div>
            </Button>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {t("deleteConfirm.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}