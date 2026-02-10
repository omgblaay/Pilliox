import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Plus,
  Pill,
  Trash2,
  Edit,
  Clock,
  Droplet,
  Bell,
  Save,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";
import {
  PillsSettings,
  PillSetting,
} from "../components/PillsSettings";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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
  const [editModalOpen, setEditModalOpen] = useState(false);

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
          console.error("Failed to fetch user settings");
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
    setPills([...pills, newPill]);
    setEditingPill(newPill);
    setEditModalOpen(true);
  };

  const updatePill = (
    id: string,
    updates: Partial<PillSetting>,
  ) => {
    setPills(
      pills.map((pill) =>
        pill.id === id ? { ...pill, ...updates } : pill,
      ),
    );
    if (editingPill && editingPill.id === id) {
      setEditingPill({ ...editingPill, ...updates });
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
              <p>
                {t("medications.subtitle") ||
                  "Manage your medications"}
              </p>
            </div>
            <Button onClick={addPill}>
              <Plus
                className="h-5 w-5 md:h-6 md:w-6"
                strokeWidth={2}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {medications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className=""
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-purple-400"></div>
              </div>
            ) : (
              <>
                {pills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t("pillsSettings.noPills") ||
                        "No medications yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pills.map((pill) => (
                      <div
                        key={pill.id}
                        className="flex items-center bg-popover gap-3 px-3 h-16 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingPill(pill);
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
                        <span className="flex-1 font-medium text-sm">
                          {pill.name ||
                            t(
                              "pillsSettings.medicationPlaceholder",
                            ) ||
                            "Medication"}
                        </span>

                        {/* Pills/Value Counter */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {(pill.type || "pills") ===
                          "pills" ? (
                            <Pill className="h-4 w-4" />
                          ) : (
                            <Droplet className="h-4 w-4" />
                          )}
                          <span>{pill.defaultDosage}</span>
                        </div>

                        {/* Notification Icon */}
                        {pill.notificationsEnabled && (
                          <Bell className="h-4 w-4 text-purple-600" />
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Medication Button */}
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {medications.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: med.color + "20",
                        }}
                      >
                        <Pill
                          className="w-6 h-6"
                          style={{ color: med.color }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg">
                          {med.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage}
                        </p>
                        {med.frequency && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{med.frequency}</span>
                            {med.time && (
                              <span>• {med.time}</span>
                            )}
                          </div>
                        )}
                        {med.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {med.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEditMedication(med)
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteMedication(med.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle>
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
            </DialogDescription>
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
                  <div className="flex flex-wrap gap-1 w-full">
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

                  <div className="bg-background/60 rounded-2xl p-1 flex gap-0">
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
          <div className="border-t border-borde pt-4 flex sm:flex-row flex-col-reverse gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditModalOpen(false);
              }}
            >
              {t("pillsSettings.discard") || "Discard"}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setEditModalOpen(false);
              }}
            >
              <Save className="h-5 w-5" strokeWidth={2} />
              {t("pillsSettings.saveChanges") || "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}