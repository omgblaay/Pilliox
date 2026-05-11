import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import {
  Plus,
  ArrowLeft,
  Pill,
  Activity,
  Bell,
  BellOff,
  Droplet,
} from "lucide-react";
import { motion } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";
import { PillsSettings, PillSetting } from "../components/PillsSettings.tsx";
import { COLORS } from "../components/ColorPicker";
import { MedicationEditDialog } from "../components/MedicationEditDialog";
import { MedicationDetailPage } from "../components/MedicationDetailPage";
import { MedicationScheduleEditor } from "../components/MedicationScheduleEditor";
import { notificationService } from "../services/notificationService";
import { toast } from "sonner";

interface MedicationsPageProps {
  accessToken: string;
  projectId: string;
  anonKey: string;
}

export function MedicationsPage({
  accessToken,
  projectId,
  anonKey,
}: MedicationsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [pillsSettingsOpen, setPillsSettingsOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [pills, setPills] = useState<PillSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPill, setEditingPill] = useState<PillSetting | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [detailPill, setDetailPill] = useState<PillSetting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);

  useEffect(() => {
    notificationService.initialize().catch(() => {});
  }, []);

  useEffect(() => {
    if ((location.state as any)?.openAdd) {
      const newPill: PillSetting = {
        id: `pill_${Date.now()}`,
        name: "",
        defaultDosage: 1,
        color: COLORS[0].hex,
        type: "pills",
      };
      setEditingPill(newPill);
      setIsAddingNew(true);
      setEditModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!accessToken) return;
    fetchWithTokenRefresh(
      `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
    ).then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id || "");
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.requiresReauth) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userEmail");
            window.location.href = "/auth";
          }
        } catch {}
      }
    }).catch(() => {});
  }, [accessToken, projectId, anonKey]);

  useEffect(() => {
    setIsLoading(false);
  }, [pillsSettingsOpen]);

  useEffect(() => {
    if (userId) loadPillsSettings();
  }, [userId]);

  const loadPillsSettings = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPills(data.pills || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const addPill = () => {
    const newPill: PillSetting = {
      id: `pill_${Date.now()}`,
      name: "",
      defaultDosage: 1,
      color: COLORS[0].hex,
      type: "pills",
    };
    setEditingPill(newPill);
    setIsAddingNew(true);
    setEditModalOpen(true);
  };

  const handleDiscard = () => {
    setEditModalOpen(false);
    setEditingPill(null);
    setIsAddingNew(false);
  };

  const handleSaved = (pill: PillSetting, isNew: boolean) => {
    setPills((prev) =>
      isNew ? [...prev, pill] : prev.map((p) => (p.id === pill.id ? pill : p)),
    );
    setEditingPill(null);
    setIsAddingNew(false);
  };

  const handleDeleted = (pillId: string) => {
    void notificationService.cancelPillNotifications(pillId).catch(() => {});
    setPills((prev) => prev.filter((p) => p.id !== pillId));
    setEditingPill(null);
    setIsAddingNew(false);
  };

  const handleScheduleSaved = async (updates: Partial<PillSetting>) => {
    if (!detailPill || !userId) return;

    const updatedPill = { ...detailPill, ...updates };
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${detailPill.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${anonKey}`,
          "X-User-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPill),
      },
    );

    if (!response.ok) {
      toast.error(t("pillsSettings.deleteError") || "Failed to save");
      throw new Error("Failed to save medication schedule");
    }

    setPills((prev) => prev.map((p) => (p.id === updatedPill.id ? updatedPill : p)));
    setDetailPill(updatedPill);
    await notificationService.updatePillNotifications(updatedPill).catch(() => {
      toast.error(t("notifications.scheduleError") || "Saved, but notification scheduling failed");
    });
    toast.success(t("pillsSettings.saveChanges") || "Changes saved");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-blue-400" />
          <p className="mt-4 text-muted-foreground">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}

      <div className="sticky top-0 bg-background">
        <div className="max-w-screen-lg mx-auto px-4 sm:py-8 py-4">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app")} className="h-10 w-10">
              <ArrowLeft />
            </Button>
            <div className="flex-1">
              <h1>{t("medications.title") || "Medications"}</h1>
            </div>
            <Button onClick={addPill}>
              <Plus className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
              <span className="hidden md:inline-block">{t("medications.add")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-purple-400" />
          </div>
        ) : pills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("pillsSettings.noPills") || "No medications yet"}</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Pills Group */}
            {pills.filter((p) => (p.type || "pills") === "pills").length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground px-1">
                  <Pill className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{t("medications.pills") || "Pills"}</h3>
                </div>
                <Card className="divide-y divide-border">
                  {pills.filter((p) => (p.type || "pills") === "pills").map((pill) => (
                    <div key={pill.id} className="items-center">
                      <Button
                        variant="menuItem"
                        className="flex-1 sm:!px-5 !gap-5 sm:!py-3"
                        onClick={() => {
                          setDetailPill({ ...pill });
                          setDetailOpen(true);
                        }}
                      >
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color || "#a855f7" }} />
                        <div className="flex-1 flex-col items-center gap-2">
                          <span className="flex-1 font-normal text-foreground">
                          {pill.name || t("pillsSettings.medicationPlaceholder") || "Medication"}
                        </span>
                        <div className="flex items-center text-sm gap-2 text-muted-foreground">
                          <Pill className="size-4" />
                          <span>{pill.defaultDosage}</span>
                        </div>
                         </div>
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2">
                            <Bell className="size-4 text-blue-500" />
                            <span>{pill.notificationTime && ` ${pill.notificationTime}`}</span>
                          </div>
                        ) : (
                          <BellOff className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Medical Values Group */}
            {pills.filter((p) => p.type === "value").length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground px-1">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{t("medications.values") || "Medical Values"}</h3>
                </div>
                <Card className="divide-y divide-border">
                  {pills.filter((p) => p.type === "value").map((pill) => (
                    <div key={pill.id} className="flex items-center">
                      <Button
                        variant="menuItem"
                        className="flex-1 sm:!px-5 !gap-5 sm:!py-3"
                        onClick={() => {
                          setDetailPill({ ...pill });
                          setDetailOpen(true);
                        }}
                      >

                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color || "#a855f7" }} />
                        <div className="flex-1 flex-col items-center gap-2">
                        <span className="flex-1 font-medium text-foreground">
                          {pill.name || t("pillsSettings.medicationPlaceholder") || "Medication"}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Droplet className="size-3" />
                          <span>{pill.defaultDosage}{pill.unit ? ` ${pill.unit}` : ""}</span>
                        </div>
                        </div>
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2">
                            <Bell className="size-4 text-blue-500" />
                            <span>{pill.notificationTime && ` ${pill.notificationTime}`}</span>
                          </div>
                        ) : (
                          <BellOff className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />

      <PillsSettings
        open={pillsSettingsOpen}
        onOpenChange={setPillsSettingsOpen}
        userId={userId}
        accessToken={accessToken}
      />

      <MedicationDetailPage
        open={detailOpen}
        onOpenChange={setDetailOpen}
        pill={detailPill}
        projectId={projectId}
        onEdit={() => {
          setDetailOpen(false);
          setEditingPill(detailPill);
          setIsAddingNew(false);
          setEditModalOpen(true);
        }}
        onEditSchedule={() => setScheduleEditorOpen(true)}
      />

      {detailPill && (
        <MedicationScheduleEditor
          open={scheduleEditorOpen}
          onOpenChange={setScheduleEditorOpen}
          pill={detailPill}
          onSave={handleScheduleSaved}
        />
      )}

      <MedicationEditDialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open && editingPill && !isAddingNew) {
            setDetailPill(editingPill);
            setDetailOpen(true);
          }
        }}
        pill={editingPill}
        isAddingNew={isAddingNew}
        userId={userId}
        projectId={projectId}
        anonKey={anonKey}
        accessToken={accessToken}
        onSaved={(saved, isNew) => {
          handleSaved(saved, isNew);
          void notificationService.updatePillNotifications(saved).catch(() => {
            toast.error(t("notifications.scheduleError") || "Saved, but notification scheduling failed");
          });
          setDetailPill(saved);
          if (!isNew) setDetailOpen(true);
        }}
        onDeleted={handleDeleted}
        onDiscard={() => {
          const wasAddingNew = isAddingNew;
          handleDiscard();
          if (!wasAddingNew) setDetailOpen(true);
        }}
      />
    </div>
  );
}
