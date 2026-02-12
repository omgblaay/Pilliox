import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  ArrowLeft,
  Pill,
  Activity,
  Bell,
  BellOff,
  Trash2,
  ChevronRight,
  X,
  Clock,
  Edit,
  Save,
  Droplet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";
import {
  PillsSettings,
  PillSetting,
} from "../components/PillsSettings";
import { toast } from "sonner";
import { notificationService } from "../services/notificationService";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  color: string;
  frequency?: string;
  time?: string;
  notes?: string;
}

interface MedicationsPageProps {
  accessToken: string;
  projectId: string;
  anonKey: string;
}

const PILL_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
];

export function MedicationsPage({
  accessToken,
  projectId,
  anonKey,
}: MedicationsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pillsSettingsOpen, setPillsSettingsOpen] =
    useState(false);
  const [userId, setUserId] = useState<string>("");

  // State for inline pills list
  const [pills, setPills] = useState<PillSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPill, setEditingPill] =
    useState<PillSetting | null>(null);
  const [originalPill, setOriginalPill] =
    useState<PillSetting | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] =
    useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState("");
  const [entryCount, setEntryCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log("Notification service initialized");
      } catch (error) {
        console.error(
          "Failed to initialize notifications:",
          error,
        );
      }
    };

    initNotifications();
  }, []);

  // Get userId from accessToken
  useEffect(() => {
    const getUserId = async () => {
      if (!accessToken) return;

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
          setUserId(data.user.id || "");
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch user settings:",
            response.status,
            errorText,
          );

          // Check if the error requires re-authentication
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.requiresReauth) {
              console.log(
                "Session invalid - redirecting to login...",
              );
              // Clear local storage and redirect to auth
              localStorage.removeItem("accessToken");
              localStorage.removeItem("userEmail");
              window.location.href = "/auth";
            }
          } catch (e) {
            // Error parsing JSON, continue normally
          }
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };

    getUserId();
  }, [accessToken, projectId, anonKey]);

  // Load medications from localStorage or backend
  useEffect(() => {
    const loadMedications = () => {
      const stored = localStorage.getItem("medications");
      if (stored) {
        try {
          setMedications(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse medications:", e);
        }
      }
      setIsLoading(false);
    };

    loadMedications();
  }, [pillsSettingsOpen]); // Reload when modal closes

  // Load pills settings when userId is available
  useEffect(() => {
    if (userId && medications.length === 0) {
      loadPillsSettings();
    }
  }, [userId, medications.length]);

  const loadPillsSettings = async () => {
    if (!userId) {
      console.error(
        "Cannot load pills settings: userId is empty",
      );
      return;
    }

    setLoading(true);
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
        setPills(data.pills || []);
      } else {
        console.error("Failed to load pills settings");
      }
    } catch (error) {
      console.error("Error loading pills settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPill = () => {
    const newPill: PillSetting = {
      id: `pill_${Date.now()}`,
      name: "",
      defaultDosage: 1,
      color: PILL_COLORS[0].value,
      type: "pills",
    };
    setEditingPill(newPill);
    setOriginalPill(null);
    setIsAddingNew(true);
    setEditModalOpen(true);
  };

  const updatePill = (
    id: string,
    updates: Partial<PillSetting>,
  ) => {
    // Only update the editingPill state, not the pills array
    // The pills array will be updated when save is clicked
    if (editingPill && editingPill.id === id) {
      setEditingPill({ ...editingPill, ...updates });
    }
  };

  // Check calendar entries for medication
  const checkCalendarEntries = async (pillId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar-entries/count/${userId}/${pillId}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error checking calendar entries:", error);
      return 0;
    }
  };

  // Handle delete button click
  const handleDeleteClick = async () => {
    if (!editingPill) return;

    const count = await checkCalendarEntries(editingPill.id);
    setEntryCount(count);
    setDeleteConfirmOpen(true);
  };

  // Perform the actual deletion
  const confirmDelete = async () => {
    if (!editingPill) return;

    // Get the expected keyword based on current language
    const expectedKeyword = t(
      "pillsSettings.deleteKeywordPlaceholder",
    )
      .replace("Type ", "")
      .replace("Wpisz ", "")
      .replace("eingeben", "LÖSCHEN")
      .replace("USUŃ", "USUŃ");

    // Check if keyword matches (case-insensitive)
    if (
      deleteKeyword.trim().toUpperCase() !==
        expectedKeyword.toUpperCase() &&
      entryCount > 0
    ) {
      toast.error(t("pillsSettings.deleteKeywordMismatch"));
      return;
    }

    setIsDeleting(true);

    try {
      // Delete from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );

      if (response.ok) {
        // Remove from local state
        setPills(pills.filter((p) => p.id !== editingPill.id));
        toast.success(t("pillsSettings.deleteSuccess"));
        setDeleteConfirmOpen(false);
        setEditModalOpen(false);
        setEditingPill(null);
        setOriginalPill(null);
        setDeleteKeyword("");
      } else {
        toast.error(t("pillsSettings.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast.error(t("pillsSettings.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Save medication changes
  const handleSaveMedication = async () => {
    if (!editingPill || !userId) return;

    // Validate required fields
    if (!editingPill.name || editingPill.name.trim() === "") {
      toast.error(
        t("pillsSettings.medicationPlaceholder") ||
          "Please enter a medication name",
      );
      return;
    }

    setIsSaving(true);

    try {
      const method = isAddingNew ? "POST" : "PUT";
      const url = isAddingNew
        ? `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${anonKey}`,
          "X-User-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingPill),
      });

      if (response.ok) {
        if (isAddingNew) {
          // Add new medication to list
          setPills([...pills, editingPill]);
        } else {
          // Update existing medication
          setPills(
            pills.map((p) =>
              p.id === editingPill.id ? editingPill : p,
            ),
          );
        }

        // Schedule or update notifications
        try {
          if (editingPill.notificationsEnabled) {
            await notificationService.updatePillNotifications(
              editingPill,
            );
            console.log(
              `Notifications scheduled for ${editingPill.name}`,
            );
          } else {
            // Cancel notifications if they were disabled
            await notificationService.cancelPillNotifications(
              editingPill.id,
            );
            console.log(
              `Notifications cancelled for ${editingPill.name}`,
            );
          }
        } catch (notifError) {
          console.error(
            "Error managing notifications:",
            notifError,
          );
          // Don't fail the save if notifications fail
          toast.error(
            "Medication saved, but notification setup failed. Please check notification permissions.",
          );
        }

        toast.success(
          isAddingNew
            ? t("pillsSettings.addMedication") ||
                "Medication added"
            : t("pillsSettings.saveChanges") || "Changes saved",
        );

        setEditModalOpen(false);
        setEditingPill(null);
        setOriginalPill(null);
        setIsAddingNew(false);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error ||
            t("pillsSettings.deleteError") ||
            "Failed to save",
        );
      }
    } catch (error) {
      console.error("Error saving medication:", error);
      toast.error(
        t("pillsSettings.deleteError") ||
          "Failed to save medication",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Discard medication changes
  const handleDiscardChanges = () => {
    if (isAddingNew) {
      // For new medications, just close the modal
      setEditModalOpen(false);
      setEditingPill(null);
      setOriginalPill(null);
      setIsAddingNew(false);
    } else {
      // For existing medications, revert to original
      if (originalPill) {
        setEditingPill(originalPill);
      }
      setEditModalOpen(false);
      setEditingPill(null);
      setOriginalPill(null);
    }
  };

  const handleAddMedication = () => {
    setPillsSettingsOpen(true);
  };

  const handleEditMedication = (med: Medication) => {
    // Store medication data for editing
    localStorage.setItem(
      "editingMedication",
      JSON.stringify(med),
    );
    navigate("/app/medications/edit");
  };

  const handleDeleteMedication = (id: string) => {
    const updatedMeds = medications.filter((m) => m.id !== id);
    setMedications(updatedMeds);
    localStorage.setItem(
      "medications",
      JSON.stringify(updatedMeds),
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-blue-400"></div>
          <p className="mt-4 text-muted-foreground">
            {t("common.loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-screen-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/app")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1>{t("medications.title") || "Medications"}</h1>
              <p className="small">
                {t("medications.subtitle") ||
                  "Manage your medications"}
              </p>
            </div>
            <Button onClick={addPill}>
              <Plus
                className="h-5 w-5 md:h-6 md:w-6"
                strokeWidth={2}
              />
              <span className="hidden md:inline-block">
                {t("medications.add")}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-purple-400"></div>
          </div>
        ) : pills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t("pillsSettings.noPills") ||
                "No medications yet"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Pills Group */}
            {pills.filter(
              (p) => (p.type || "pills") === "pills",
            ).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground px-1">
                  <Pill className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">
                    {t("medications.pills") || "Pills"}
                  </h3>
                </div>

                <Card className="divide-y divide-border">
                  {pills
                    .filter(
                      (p) => (p.type || "pills") === "pills",
                    )
                    .map((pill) => (
                      <Button
                        variant="menuItem"
                        key={pill.id}
                        onClick={() => {
                          setEditingPill({ ...pill });
                          setOriginalPill({ ...pill });
                          setIsAddingNew(false);
                          setEditModalOpen(true);
                        }}
                      >
                        {/* Colored Dot */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              pill.color || "#a855f7",
                          }}
                        />

                        {/* Name */}
                        <span className="flex-1 font-medium text-foreground">
                          {pill.name ||
                            t(
                              "pillsSettings.medicationPlaceholder",
                            ) ||
                            "Medication"}
                        </span>

                        {/* Pills Counter */}
                        <div className="flex items-center text-sm gap-2 text-muted-foreground">
                          <Pill className="h-4 w-4" />
                          <span>{pill.defaultDosage}</span>
                        </div>

                        {/* Notification Icon */}
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2 0">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <span>
                              {pill.notificationTime &&
                                ` ${pill.notificationTime}`}
                            </span>
                          </div>
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    ))}
                </Card>
              </div>
            )}

            {/* Medical Values Group */}
            {pills.filter((p) => p.type === "value").length >
              0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground px-1">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">
                    {t("medications.values") ||
                      "Medical Values"}
                  </h3>
                </div>

                <Card className="divide-y divide-border">
                  {pills
                    .filter((p) => p.type === "value")
                    .map((pill) => (
                      <Button
                        key={pill.id}
                        variant="menuItem"
                        onClick={() => {
                          setEditingPill({ ...pill });
                          setOriginalPill({ ...pill });
                          setIsAddingNew(false);
                          setEditModalOpen(true);
                        }}
                      >
                        {/* Colored Dot */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              pill.color || "#a855f7",
                          }}
                        />

                        {/* Name */}
                        <span className="flex-1 font-medium text-foreground">
                          {pill.name ||
                            t(
                              "pillsSettings.medicationPlaceholder",
                            ) ||
                            "Medication"}
                        </span>

                        {/* Value Counter */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Droplet className="h-4 w-4" />
                          <span>{pill.defaultDosage}</span>
                        </div>

                        {/* Notification Icon */}
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2 0">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <span>
                              {pill.notificationTime &&
                                ` ${pill.notificationTime}`}
                            </span>
                          </div>
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Pills Settings Modal */}
      <PillsSettings
        open={pillsSettingsOpen}
        onOpenChange={setPillsSettingsOpen}
        userId={userId}
        accessToken={accessToken}
      />

      {/* Edit Pill Modal */}
      <Dialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader className="flex gap-4 flex-row items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/app")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="flex-1">
              {editingPill?.name
                ? t("pillsSettings.editMedication") ||
                  "Edit Medication"
                : t("pillsSettings.addMedication") ||
                  "Add Medication"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingPill?.name
                ? t(
                    "pillsSettings.editMedicationDescription",
                  ) || "Edit your medication settings"
                : t("pillsSettings.addMedicationDescription") ||
                  "Add a new medication to your list"}
            </DialogDescription>{" "}
            {!isAddingNew && editingPill?.name && (
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                className="mr-2"
                size="sm"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                <span className="hidden md:inline">
                  {t("pillsSettings.deleteMedication") ||
                    "Delete"}
                </span>
              </Button>
            )}
          </DialogHeader>
          {editingPill && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 ">
                {/* Name */}
                <div className="space-y-2 flex-1 flex-row">
                  <Label>
                    {t("pillsSettings.medicationName")}
                  </Label>
                  <Input
                    value={editingPill.name}
                    onChange={(e) =>
                      updatePill(editingPill.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder={t(
                      "pillsSettings.medicationPlaceholder",
                    )}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2 flex-1">
                  <Label>{t("pillsSettings.color")}</Label>
                  <div className="flex flex-wrap gap-2 w-full">
                    {PILL_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          updatePill(editingPill.id, {
                            color: color.value,
                          });
                          setEditingPill({
                            ...editingPill,
                            color: color.value,
                          });
                        }}
                        className={`flex-1 min-w-0 h-10 cursor-pointer rounded-full border-2 transition-all ${
                          editingPill.color === color.value
                            ? "border-black-1000 scale-110"
                            : "border-none"
                        }`}
                        style={{
                          backgroundColor: color.value,
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col h-auto gap-5 md:flex-row">
                {/* Type */}
                <div className="flex-1">
                  <Label>{t("pillsSettings.type")}</Label>

                  <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                    <Button
                      size="sm"
                      type="button"
                      variant="tabGroup"
                      className="px-[8px] py-[0px]"
                      data-state={
                        (editingPill.type || "pills") ===
                        "pills"
                          ? "active"
                          : "inactive"
                      }
                      onClick={() => {
                        updatePill(editingPill.id, {
                          type: "pills",
                        });
                        setEditingPill({
                          ...editingPill,
                          type: "pills",
                        });
                      }}
                    >
                      <Pill
                        className="h-3 w-3"
                        strokeWidth={1.33}
                      />
                      <span>
                        {t("pillsSettings.typePills")}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="tabGroup"
                      className="px-[8px] py-[0px]"
                      data-state={
                        (editingPill.type || "pills") ===
                        "value"
                          ? "active"
                          : "inactive"
                      }
                      onClick={() => {
                        updatePill(editingPill.id, {
                          type: "value",
                        });
                        setEditingPill({
                          ...editingPill,
                          type: "value",
                        });
                      }}
                    >
                      <Droplet
                        className="h-3 w-3"
                        strokeWidth={1.33}
                      />
                      <span>
                        {t("pillsSettings.typeValue")}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Default Dosage */}
                <div className="flex-1">
                  <Label>
                    {(editingPill.type || "pills") === "pills"
                      ? t("pillsSettings.defaultDosage")
                      : t("pillsSettings.defaultValue")}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={
                      (editingPill.type || "pills") === "pills"
                        ? "0.5"
                        : "0.01"
                    }
                    value={editingPill.defaultDosage}
                    onChange={(e) => {
                      const newDosage =
                        parseFloat(e.target.value) || 0;
                      updatePill(editingPill.id, {
                        defaultDosage: newDosage,
                      });
                      setEditingPill({
                        ...editingPill,
                        defaultDosage: newDosage,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="border-t pt-4 border-border/80">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-1 items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base flex-1 whitespace-nowrap">
                      {t("pillsSettings.notifications")}
                    </Label>{" "}
                    <Switch
                      checked={
                        editingPill.notificationsEnabled ||
                        false
                      }
                      onCheckedChange={(checked) => {
                        updatePill(editingPill.id, {
                          notificationsEnabled: checked,
                          notificationTime:
                            checked &&
                            !editingPill.notificationTime
                              ? "09:00"
                              : editingPill.notificationTime,
                          notificationFrequency:
                            checked &&
                            !editingPill.notificationFrequency
                              ? "daily"
                              : editingPill.notificationFrequency,
                        });
                        setEditingPill({
                          ...editingPill,
                          notificationsEnabled: checked,
                          notificationTime:
                            checked &&
                            !editingPill.notificationTime
                              ? "09:00"
                              : editingPill.notificationTime,
                          notificationFrequency:
                            checked &&
                            !editingPill.notificationFrequency
                              ? "daily"
                              : editingPill.notificationFrequency,
                        });

                        // Request permissions immediately when enabling notifications
                        if (checked) {
                          notificationService
                            .ensurePermissions()
                            .then((granted) => {
                              if (!granted) {
                                toast.error(
                                  "Notification permissions were denied. Please enable them in your browser settings.",
                                );
                              } else {
                                toast.success(
                                  "Notifications enabled! They will be scheduled when you save.",
                                );
                              }
                            })
                            .catch((error) => {
                              console.error(
                                "Permission request failed:",
                                error,
                              );
                              toast.error(
                                "Failed to request notification permissions",
                              );
                            });
                        }
                      }}
                    />
                  </div>

                  {editingPill.notificationsEnabled && (
                    <div className="flex gap-5">
                      {/* Time Picker */}
                      <div className="flex-1">
                        <Input
                          type="time"
                          value={
                            editingPill.notificationTime ||
                            "09:00"
                          }
                          onChange={(e) => {
                            updatePill(editingPill.id, {
                              notificationTime: e.target.value,
                            });
                            setEditingPill({
                              ...editingPill,
                              notificationTime: e.target.value,
                            });
                          }}
                        />
                      </div>

                      {/* Frequency Selector */}
                      <div className="flex-1">
                        <Select
                          value={
                            editingPill.notificationFrequency ||
                            "daily"
                          }
                          onValueChange={(value) => {
                            const freq = value as
                              | "daily"
                              | "every2days"
                              | "every3days";
                            updatePill(editingPill.id, {
                              notificationFrequency: freq,
                            });
                            setEditingPill({
                              ...editingPill,
                              notificationFrequency: freq,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">
                              {t("pillsSettings.daily")}
                            </SelectItem>
                            <SelectItem value="every2days">
                              {t("pillsSettings.every2days")}
                            </SelectItem>
                            <SelectItem value="every3days">
                              {t("pillsSettings.every3days")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="border-t border-borde pt-4 flex sm:flex-row gap-4">
            <div className="flex-1 flex gap-4 ">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDiscardChanges}
                disabled={isSaving}
              >
                {t("pillsSettings.discard") || "Discard"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveMedication}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      className="hidden lg:block h-5 w-5"
                      strokeWidth={2}
                    />
                    {t("pillsSettings.saveChanges") || "Save"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="flex-row mb-4">
            <div className="flex flex-col gap-2 flex-1">
              <DialogTitle className="text-red-600 dark:text-red-400">
                {t("pillsSettings.deleteConfirmTitle") ||
                  "Delete Medication?"}
              </DialogTitle>
              <DialogDescription>
                {entryCount > 0
                  ? t(
                      "pillsSettings.deleteConfirmDescription",
                    ).replace("{count}", entryCount.toString())
                  : t("pillsSettings.deleteConfirmNoEntries") ||
                    "Are you sure you want to delete this medication?"}
              </DialogDescription>
            </div>
          </DialogHeader>

          {entryCount > 0 && (
            <div className="space-y-2">
              <Label>
                {t("pillsSettings.deleteKeywordPrompt")}
              </Label>
              <Input
                value={deleteKeyword}
                onChange={(e) =>
                  setDeleteKeyword(e.target.value)
                }
                placeholder={t(
                  "pillsSettings.deleteKeywordPlaceholder",
                )}
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteKeyword("");
              }}
              disabled={isDeleting}
            >
              {t("pillsSettings.cancel") || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={
                isDeleting || (entryCount > 0 && !deleteKeyword)
              }
            >
              {isDeleting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                  {t("pillsSettings.confirmDelete") ||
                    "Confirm Delete"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}