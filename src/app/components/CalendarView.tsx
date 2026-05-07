import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
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
  CalendarSync,
  ChevronDown,
  LogOut,
  Droplet,
  Pill,
  Check,
  X,
  Plus,
  Minus,
  Palette,
  Settings as SettingsIcon,
  User,
  Pencil,
  Menu,
  Home,
  Crown,
  Bell,
  BellOff,
  Clock,
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
import { AboutModal } from "./AboutModal";
import { SidebarMenu } from "./SidebarMenu";
import { AdHocMedicationDialog, type AdHocMedicationData } from "./AdHocMedicationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  PillsSettings,
  type PillSetting,
} from "./PillsSettings";
import { cn } from "./ui/utils";
import { useTheme, type Theme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import Vector from "../../imports/Vector";
import { BottomNavigation } from "./BottomNavigation";
import { Logo } from "../components/Logo";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import { MiniDayPicker } from "./MiniDayPicker";
import { ColorPicker, COLORS } from "./ColorPicker";
import { EditDayDialog } from "./EditDayDialog";
import { MarkDaysDialog } from "./MarkDaysDialog";

interface PillDosage {
  pillId: string;
  dosage: number;
}

interface AdHocMedication {
  id: string;
  name: string;
  dosage: number;
  unit: string;
  notificationEnabled?: boolean;
  notificationTime?: string; // HH:mm format
}

interface DayNotification {
  enabled: boolean;
  time: string; // HH:mm format
}

interface CalendarEntry {
  amount: string;
  note: string;
  pills?: string; // JSON string of PillDosage[]
  adHocMeds?: string; // JSON string of AdHocMedication[]
  pillDosageOverrides?: string; // JSON string of Record<string, number>
  color?: string;
  tag?: string;
}

interface CalendarViewProps {
  accessToken: string;
  projectId: string;
  anonKey: string;
}

// Helper function to get the appropriate color for the current theme
function getColorForTheme(
  storedColor: string,
  isDarkMode: boolean,
): string {
  if (!isDarkMode) return storedColor;

  // Find if this is a known light color and return its dark variant
  const colorObj = COLORS.find(
    (c) => c.hex?.toLowerCase() === storedColor.toLowerCase(),
  );
  return colorObj ? (colorObj.dark ?? storedColor) : storedColor;
}

export function CalendarView({
  accessToken,
  projectId,
  anonKey,
}: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [dosageOverrides, setDosageOverrides] = useState<Record<string, number>>({});
  const [adHocMeds, setAdHocMeds] = useState<AdHocMedication[]>(
    [],
  );
  const [addAdHocDialogOpen, setAddAdHocDialogOpen] =
    useState(false);
  const [editingAdHocMed, setEditingAdHocMed] = useState<AdHocMedication | null>(null);
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
  const [multiPickerMonth, setMultiPickerMonth] = useState(new Date());

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [tempNote, setTempNote] = useState("");

  // Settings
  const [pillsSettingsOpen, setPillsSettingsOpen] =
    useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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
  const [editTagDialogOpen, setEditTagDialogOpen] = useState(false);
  const [tempTagText, setTempTagText] = useState("");
  const [tempTagColor, setTempTagColor] = useState(COLORS[0]);
  const [tagAddDays, setTagAddDays] = useState<Set<string>>(new Set());
  const [tagRemoveDays, setTagRemoveDays] = useState<Set<string>>(new Set());
  const [editTagPickerMonth, setEditTagPickerMonth] = useState(new Date());

  // Theme
  const { theme, setTheme } = useTheme("system");

  // Sync ad-hoc medications when dialog opens or selected date changes
  useEffect(() => {
    if (dialogOpen && selectedDate) {
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const entry = entries[dateKey];

      // Parse ad-hoc medications JSON for the selected date
      try {
        const adHocMedsData = entry?.adHocMeds
          ? JSON.parse(entry.adHocMeds)
          : [];
        setAdHocMeds(
          Array.isArray(adHocMedsData) ? adHocMedsData : [],
        );
      } catch (error) {
        console.error(
          "Error parsing ad-hoc medications data:",
          error,
        );
        setAdHocMeds([]);
      }
    }
  }, [dialogOpen, selectedDate, entries]);

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

  // Sync modal state with URL
  useEffect(() => {
    if (location.pathname === "/medications") {
      setPillsSettingsOpen(true);
    }
  }, [location.pathname]);

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
        const response = await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
        );

        if (response.ok) {
          const data = await response.json();
          setName(data.user.name || "");
          setUserId(data.user.id || "");

          // Load user settings (theme, week start preference, and view mode)
          if (data.settings) {
            if (data.settings.theme) {
              setTheme(data.settings.theme);
            }
            if (
              data.settings.weekStartsOnMonday !== undefined
            ) {
              setWeekStartsOnMonday(
                data.settings.weekStartsOnMonday,
              );
            }
            if (data.settings.viewMode) {
              setViewMode(data.settings.viewMode);
            }
          }
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
        const response = await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
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

        const response = await fetchWithTokenRefresh(url);

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
          fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${prevMonthKey}`,
          ),
          fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${nextMonthKey}`,
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
      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
    try {
      const overridesData = entry?.pillDosageOverrides
        ? JSON.parse(entry.pillDosageOverrides)
        : {};
      setDosageOverrides(typeof overridesData === "object" && overridesData !== null ? overridesData : {});
    } catch {
      setDosageOverrides({});
    }

    // Parse ad-hoc medications JSON
    try {
      const adHocMedsData = entry?.adHocMeds
        ? JSON.parse(entry.adHocMeds)
        : [];
      setAdHocMeds(
        Array.isArray(adHocMedsData) ? adHocMedsData : [],
      );
    } catch (error) {
      console.error(
        "Error parsing ad-hoc medications data:",
        error,
      );
      setAdHocMeds([]);
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

    // Serialize ad-hoc medications data
    const adHocMedsJson =
      adHocMeds.length > 0 ? JSON.stringify(adHocMeds) : "";

    // Serialize dosage overrides (only non-empty)
    const nonEmptyOverrides = Object.fromEntries(
      Object.entries(dosageOverrides).filter(([, v]) => v !== undefined)
    );
    const pillDosageOverridesJson =
      Object.keys(nonEmptyOverrides).length > 0 ? JSON.stringify(nonEmptyOverrides) : "";

    if (amount || note || pillsJson || adHocMedsJson || pillDosageOverridesJson) {
      newEntries[dateKey] = {
        ...newEntries[dateKey],
        amount,
        note,
        pills: pillsJson,
        adHocMeds: adHocMedsJson,
        pillDosageOverrides: pillDosageOverridesJson,
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
        adHocMeds: "",
        pillDosageOverrides: "",
      };
    }

    setEntries(newEntries);
    saveEntries(newEntries);
    setDialogOpen(false);
    setAmount("");
    setNote("");
    setPills([]);
    setAdHocMeds([]);
    setDosageOverrides({});
  };

  const handleRemoveColorTag = () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const newEntries = { ...entries };

    if (newEntries[dateKey]) {
      const { color, tag, ...rest } = newEntries[dateKey];
      if (
        !rest.amount &&
        !rest.note &&
        !rest.pills &&
        !rest.adHocMeds
      ) {
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
        if (
          !rest.amount &&
          !rest.note &&
          !rest.pills &&
          !rest.adHocMeds
        ) {
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

  const handleAdHocSave = (data: AdHocMedicationData, editingId: string | null) => {
    if (editingId) {
      setAdHocMeds(
        adHocMeds.map((med) =>
          med.id === editingId ? { ...med, ...data } : med,
        ),
      );
    } else {
      const newMed: AdHocMedication = {
        id: `adhoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      };
      setAdHocMeds([...adHocMeds, newMed]);
    }
    setEditingAdHocMed(null);
    setAddAdHocDialogOpen(false);
  };

  const handleEditAdHocMed = (med: AdHocMedication) => {
    setEditingAdHocMed(med);
    setAddAdHocDialogOpen(true);
  };

  const handleRemoveAdHocMed = (id: string) => {
    setAdHocMeds(adHocMeds.filter((med) => med.id !== id));
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
        adHocMeds: newEntries[dateKey]?.adHocMeds || "",
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

  // Save view mode preference
  const saveViewMode = async (
    newViewMode: "month" | "week",
  ) => {
    try {
      await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            viewMode: newViewMode,
            weekStartsOnMonday: weekStartsOnMonday,
            theme: theme,
          }),
        },
      );
    } catch (error) {
      console.error("Error saving view mode:", error);
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
    try {
      const overridesData = entry?.pillDosageOverrides
        ? JSON.parse(entry.pillDosageOverrides)
        : {};
      setDosageOverrides(typeof overridesData === "object" && overridesData !== null ? overridesData : {});
    } catch {
      setDosageOverrides({});
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
    try {
      const overridesData = entry?.pillDosageOverrides
        ? JSON.parse(entry.pillDosageOverrides)
        : {};
      setDosageOverrides(typeof overridesData === "object" && overridesData !== null ? overridesData : {});
    } catch {
      setDosageOverrides({});
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
      setMultiPickerMonth(currentMonth);
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
        entry.color === currentColor && (entry.tag ?? "") === (currentTag ?? "")
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
    if (!currentEntry?.color) return;

    // Find all days with the same color and tag (tag may be empty string)
    const groupedDays = findGroupedDays(
      currentEntry.color,
      currentEntry.tag ?? "",
    );

    // Update all grouped days plus any newly added days, minus removed ones
    const newEntries = { ...entries };

    // Remove tag/color from days marked for removal
    tagRemoveDays.forEach((dayKey) => {
      const entry = newEntries[dayKey];
      if (!entry) return;
      const { color: _c, tag: _t, ...rest } = entry;
      if (Object.values(rest).some(Boolean)) {
        newEntries[dayKey] = rest as typeof entry;
      } else {
        delete newEntries[dayKey];
      }
    });

    // Apply updated tag/color to remaining grouped + newly added days
    const allDaysToUpdate = new Set([...groupedDays, ...tagAddDays].filter(k => !tagRemoveDays.has(k)));
    allDaysToUpdate.forEach((dayKey) => {
      newEntries[dayKey] = {
        ...newEntries[dayKey],
        tag: tempTagText || undefined,
        color: tempTagColor.hex,
      };
    });

    setEntries(newEntries);
    saveEntries(newEntries);
    setTagAddDays(new Set());
    setTagRemoveDays(new Set());
    setEditingTag(false);
    setEditTagDialogOpen(false);
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
        c.hex?.toLowerCase() ===
        currentEntry.color?.toLowerCase(),
    );
    setTempTagColor(colorObj || COLORS[0]);
    setTagAddDays(new Set());
    setTagRemoveDays(new Set());
    setEditTagPickerMonth(selectedDate);
    setEditingTag(true);
    setEditTagDialogOpen(true);
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
    <div className="h-full bg-background relative pb-20">
      {/* Added pb-20 for bottom nav space */}
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

      {/* Mobile Sidebar Menu */}
      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          saveViewMode(mode);
        }}
        onMarkDays={() => setMultiSelectMode(true)}
        onAbout={() => setAboutOpen(true)}
        userId={userId}
      />

      {/* Header */}
      <div>
        <div className="w-full lg:max-w-[800px] mx-auto px-4 sm:px-[24px] py-4 sm:py-[20px]">
          <div className="flex items-center gap-8 justify-between mt-[0px] mr-[0px] ml-[0px] m-[0px]">
            <div className="flex items-center gap-4">
              {/* Menu button - visible only on mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-accent lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6 text-muted-foreground" />
              </Button>
              <div className="flex items-start flex-col gap-1">
                <Logo />
              </div>
            </div>
            <div className="items-center hidden lg:flex gap-3">
              {/*<Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => navigate("/app/subscription")}
                title="Manage Subscription"
              >
                <Crown className="h-6 w-6" />
              </Button>*/}

              {/* Desktop icons - hidden on mobile */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 hidden lg:flex"
                onClick={() => navigate("/app/medications")}
                title="Medication Settings"
              >
                <Pill className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12  hidden lg:flex"
                onClick={() => navigate("/app/profile")}
              >
                <User className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 hidden lg:flex"
                onClick={() => navigate("/app/settings")}
              >
                <SettingsIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:max-w-[800px] mx-auto px-4">
        {/* Calendar Card */}
        <div className="bg-white dark:bg-input-background rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Month/Week Navigation */}
          <div className="p-[12px] border-b border-border px-[12px] py-[8px]">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Mark Days Button */}
              <Button
                onClick={handleMultiSelectStart}
                variant="secondary"
                size="sm"
                disabled={multiSelectMode}
                className="flex-1 hidden sm:flex"
              >
                <Palette className="size-5" />
                {t("calendar.markDays")}
              </Button>

              {/* Center: Date Navigation */}
              <div className="flex items-center gap-2 flex-4 justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <motion.div
                  className="overflow-hidden relative flex-1"
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
                      className="text-sm font-normal text-center whitespace-nowrap"
                    >
                      {formatHeaderTitle(currentMonth)}
                    </motion.h2>
                  </AnimatePresence>
                </motion.div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>

              {/* Right: Weekly/Monthly Preview Dropdown */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMode =
                    viewMode === "month" ? "week" : "month";
                  setViewMode(newMode);
                  saveViewMode(newMode);
                }}
                className="flex-1 justify-between hidden sm:flex"
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
                <CalendarSync className="size-5 text-foreground" />
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
            className="px-4 sm:px-2 py-4 sm:py-5"
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
                  const hasAdHocMeds =
                    entry.adHocMeds &&
                    entry.adHocMeds !== "" &&
                    entry.adHocMeds !== "[]";
                  const hasColor =
                    entry.color && entry.color !== "";
                  const isSelected = selectedDates.has(dateStr);
                  const isToday = isSameDay(day, new Date());

                  // Get appropriate color for current theme
                  const displayColor = hasColor && entry.color
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
                        <div className="flex items-center gap-2 w-full">
                          {/* Day name and number */}
                          <div className="flex items-center gap-2 min-w-[64px]">
                            <span className="text-xs font-semibold w-[32px] text-muted-foreground uppercase text-left tracking-wide">
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
                          <div className="flex gap-2 flex-1 ml-auto items-center flex-row flex-wrap justify-end">
                            {/* Individual Medications Display */}
                            {(() => {
                              let pillsData: PillDosage[] = [];
                              try {
                                pillsData = entry.pills ? JSON.parse(entry.pills) : [];
                              } catch {}
                              let entryOverrides: Record<string, number> = {};
                              try {
                                entryOverrides = entry.pillDosageOverrides ? JSON.parse(entry.pillDosageOverrides) : {};
                              } catch {}
                              return (
                                <>
                                  {pillsSettings
                                    .filter((ps) => (ps.type || "pills") === "pills")
                                    .map((pillSetting) => {
                                      const pill = pillsData.find((p) => p.pillId === pillSetting.id);
                                      const isTaken = !!pill;
                                      const ghostDosage = entryOverrides[pillSetting.id] ?? pillSetting.defaultDosage;
                                      if (isTaken) {
                                        return (
                                          <div
                                            key={pillSetting.id}
                                            style={{ backgroundColor: pillSetting.color }}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 text-white rounded-md whitespace-nowrap"
                                          >
                                            <Pill className="h-3 w-3" />
                                            <span>
                                              {pillSetting.name.substring(0, 3)}: {pill!.dosage}
                                            </span>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div
                                            key={pillSetting.id}
                                            style={{ borderColor: pillSetting.color || "#a855f7", color: pillSetting.color || "#a855f7" }}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap border border-dashed opacity-90"
                                          >
                                            <Pill className="h-3 w-3" />
                                            <span>
                                              {pillSetting.name.substring(0, 3)}: {ghostDosage}
                                            </span>
                                          </div>
                                        );
                                      }
                                    })}
                                  {pillsData
                                    .filter((pill) => pillsSettings.find((ps) => ps.id === pill.pillId)?.type === "value")
                                    .map((pill) => {
                                      const pillSetting = pillsSettings.find((ps) => ps.id === pill.pillId);
                                      if (!pillSetting) return null;
                                      return (
                                        <div
                                          key={pill.pillId}
                                          style={{ backgroundColor: pillSetting.color }}
                                          className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 text-white rounded-md whitespace-nowrap"
                                        >
                                          <Droplet className="h-3 w-3" />
                                          <span>
                                            {pillSetting.name.substring(0, 3)}: {pill.dosage}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </>
                              );
                            })()}

                            {/* Ad-Hoc Medications Display - Week View */}
                            {hasAdHocMeds &&
                              (() => {
                                const adHocMedsData: AdHocMedication[] =
                                  JSON.parse(
                                    entry.adHocMeds || "[]",
                                  );
                                return adHocMedsData.map(
                                  (med) => {
                                    return (
                                      <div
                                        key={med.id}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 border-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md whitespace-nowrap bg-transparent"
                                      >
                                        {med.notificationEnabled ? (
                                          <Bell className="h-3 w-3" />
                                        ) : (
                                          <BellOff className="h-3 w-3" />
                                        )}
                                        <span>
                                          {med.name.substring(
                                            0,
                                            3,
                                          )}
                                          : {med.dosage}{" "}
                                          {t(
                                            `calendar.units.${med.unit}`,
                                          ) || med.unit}
                                        </span>
                                      </div>
                                    );
                                  },
                                );
                              })()}
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

                          {/* Individual Medications Display - Dots Only */}
                          <div className="flex gap-1 items-center justify-center flex-wrap">
                            {(() => {
                              let pillsData: PillDosage[] = [];
                              try {
                                pillsData = entry.pills ? JSON.parse(entry.pills) : [];
                              } catch {}
                              let entryOverrides: Record<string, number> = {};
                              try {
                                entryOverrides = entry.pillDosageOverrides ? JSON.parse(entry.pillDosageOverrides) : {};
                              } catch {}
                              return (
                                <>
                                  {pillsSettings
                                    .filter((ps) => (ps.type || "pills") === "pills")
                                    .map((pillSetting) => {
                                      const pill = pillsData.find((p) => p.pillId === pillSetting.id);
                                      const isTaken = !!pill;
                                      const ghostDosage = entryOverrides[pillSetting.id] ?? pillSetting.defaultDosage;
                                      if (isTaken) {
                                        return (
                                          <div
                                            key={pillSetting.id}
                                            className="text-[10px] font-semibold px-1 py-0.5 rounded text-white"
                                            style={{ backgroundColor: pillSetting.color || "#a855f7" }}
                                            title={`${pillSetting.name}: ${pill!.dosage}`}
                                          >
                                            {pill!.dosage}
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div
                                            key={pillSetting.id}
                                            className="text-[10px] font-semibold px-1 py-0.5 rounded border border-dashed opacity-90"
                                            style={{ borderColor: pillSetting.color || "#a855f7", color: pillSetting.color || "#a855f7" }}
                                            title={`${pillSetting.name}: ${ghostDosage}`}
                                          >
                                            {ghostDosage}
                                          </div>
                                        );
                                      }
                                    })}
                                  {pillsData
                                    .filter((pill) => pillsSettings.find((ps) => ps.id === pill.pillId)?.type === "value")
                                    .map((pill) => {
                                      const pillSetting = pillsSettings.find((ps) => ps.id === pill.pillId);
                                      if (!pillSetting) return null;
                                      return (
                                        <div
                                          key={pill.pillId}
                                          className="text-[10px] font-semibold px-1 py-0.5 rounded text-white"
                                          style={{ backgroundColor: pillSetting.color || "#a855f7" }}
                                          title={`${pillSetting.name}: ${pill.dosage}`}
                                        >
                                          {pill.dosage}
                                        </div>
                                      );
                                    })}
                                </>
                              );
                            })()}

                            {/* Ad-Hoc Medications Display - Colorless with Border */}
                            {hasAdHocMeds &&
                              (() => {
                                const adHocMedsData: AdHocMedication[] =
                                  JSON.parse(
                                    entry.adHocMeds || "[]",
                                  );
                                return adHocMedsData.map(
                                  (med) => {
                                    return (
                                      <div
                                        key={med.id}
                                        className="text-[10px] font-semibold px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent"
                                        title={`${med.name}: ${med.dosage}${med.unit}`}
                                      >
                                        {med.dosage} {med.unit}
                                      </div>
                                    );
                                  },
                                );
                              })()}
                          </div>

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
      <EditDayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        selectedDates={selectedDates}
        entries={entries}
        isDarkMode={isDarkMode}
        swipeDirectionRef={swipeDirectionRef}
        pillsSettings={pillsSettings}
        amount={amount}
        setAmount={setAmount}
        note={note}
        pills={pills}
        setPills={setPills}
        adHocMeds={adHocMeds}
        dosageOverrides={dosageOverrides}
        setDosageOverrides={setDosageOverrides}
        setNoteDialogOpen={setNoteDialogOpen}
        setTempNote={setTempNote}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        setAddAdHocDialogOpen={setAddAdHocDialogOpen}
        navigateToPreviousDay={navigateToPreviousDay}
        navigateToNextDay={navigateToNextDay}
        handleDayModalSwipe={handleDayModalSwipe}
        formatDialogDate={formatDialogDate}
        startEditingTag={startEditingTag}
        handleSave={handleSave}
        handleRemoveAdHocMed={handleRemoveAdHocMed}
        handleEditAdHocMed={handleEditAdHocMed}
        dateLocale={dateLocale}
      />

      {/* Multi-select Color Dialog */}
      <MarkDaysDialog
        open={multiSelectDialogOpen}
        onOpenChange={setMultiSelectDialogOpen}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        multiTag={multiTag}
        setMultiTag={setMultiTag}
        multiPickerMonth={multiPickerMonth}
        setMultiPickerMonth={setMultiPickerMonth}
        isDarkMode={isDarkMode}
        weekStartsOnMonday={weekStartsOnMonday}
        getMonthName={getMonthName}
        onApply={applyMultiSelectColors}
      />

      {/* Edit Tag Dialog */}
      <Dialog open={editTagDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setTagAddDays(new Set());
          setTagRemoveDays(new Set());
          setEditingTag(false);
          setEditTagDialogOpen(false);
        }
      }}>
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("multiSelect.tagLabel")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={tempTagText}
              onChange={(e) => setTempTagText(e.target.value)}
              placeholder="Tag"
              maxLength={50}
            />

            {/* Color Picker */}
            <ColorPicker
              selectedColor={tempTagColor}
              onSelect={(color) => setTempTagColor(color as typeof COLORS[0])}
              isDarkMode={isDarkMode}
            />

            {/* Mini day picker */}
            {selectedDate && (() => {
              const dateKey = format(selectedDate, "yyyy-MM-dd");
              const currentEntry = entries[dateKey];
              const alreadyGrouped = new Set(
                currentEntry?.color
                  ? findGroupedDays(currentEntry.color, currentEntry.tag ?? "")
                  : [dateKey],
              );
              return (
                <MiniDayPicker
                  month={editTagPickerMonth}
                  onMonthChange={setEditTagPickerMonth}
                  monthLabel={`${getMonthName(editTagPickerMonth)} ${format(editTagPickerMonth, "yyyy")}`}
                  weekStartsOnMonday={weekStartsOnMonday}
                  highlightColor={tempTagColor}
                  isDarkMode={isDarkMode}
                  label={t("nav.addDays") || "Days"}
                  getDayProps={(key) => {
                    const inGroup = alreadyGrouped.has(key);
                    const selected = tagAddDays.has(key);
                    const markedForRemoval = tagRemoveDays.has(key);
                    return {
                      className: cn(
                        inGroup && !markedForRemoval && "cursor-pointer font-semibold",
                        inGroup && markedForRemoval && "cursor-pointer opacity-90 line-through",
                        !inGroup && !selected && "hover:bg-accent cursor-pointer",
                        !inGroup && selected && "ring-1 ring-offset-1 ring-primary font-semibold cursor-pointer",
                      ),
                      highlighted: (inGroup && !markedForRemoval) || selected,
                    };
                  }}
                  onDayClick={(key) => {
                    const inGroup = alreadyGrouped.has(key);
                    const markedForRemoval = tagRemoveDays.has(key);
                    if (inGroup) {
                      const canRemove = alreadyGrouped.size - tagRemoveDays.size > 1 || markedForRemoval;
                      if (!canRemove) return;
                      setTagRemoveDays((prev) => {
                        const next = new Set(prev);
                        next.has(key) ? next.delete(key) : next.add(key);
                        return next;
                      });
                    } else {
                      setTagAddDays((prev) => {
                        const next = new Set(prev);
                        next.has(key) ? next.delete(key) : next.add(key);
                        return next;
                      });
                    }
                  }}
                />
              );
            })()}
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTagAddDays(new Set());
                setTagRemoveDays(new Set());
                setEditingTag(false);
                setEditTagDialogOpen(false);
              }}
              className="flex-1"
            >
              <X className="h-3 w-3 mr-1" />
              {t("calendar.cancel")}
            </Button>
            <Button onClick={updateGroupedTag} className="flex-1">
              <Check className="h-3 w-3 mr-1" />
              {t("calendar.apply")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("calendar.note")}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t("day.notePlaceholder")}
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            rows={5}
            className="resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            {tempNote && (
              <Button
                variant="outline"
                onClick={() => {
                  setNote("");
                  setNoteDialogOpen(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                {t("calendar.removeTag")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setNoteDialogOpen(false)}
              className="flex-1"
            >
              {t("calendar.cancel")}
            </Button>
            <Button
              onClick={() => {
                setNote(tempNote);
                setNoteDialogOpen(false);
              }}
              className="flex-1"
            >
              {t("calendar.apply") || "OK"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Ad-Hoc Medication Dialog */}
      <AdHocMedicationDialog
        open={addAdHocDialogOpen}
        onOpenChange={(open) => {
          setAddAdHocDialogOpen(open);
          if (!open) setEditingAdHocMed(null);
        }}
        editingMed={editingAdHocMed}
        onSave={handleAdHocSave}
      />


      {/* Pills Settings Modal */}
      <PillsSettings
        open={pillsSettingsOpen}
        onOpenChange={(open) => {
          setPillsSettingsOpen(open);
          if (open) {
            navigate("/medications", { replace: true });
          } else {
            navigate("/app", { replace: true });
          }
        }}
        userId={userId}
        accessToken={accessToken}
      />

      {/* About App Modal */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent size="small">
          <DialogHeader>
            <div className="flex-col flex-1">
              <DialogTitle className="mb-2">
                {t("deleteConfirm.title")}
              </DialogTitle>
              <DialogDescription>
                {t("deleteConfirm.description")}
              </DialogDescription>
            </div>
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
              className="w-full "
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {t("deleteConfirm.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}