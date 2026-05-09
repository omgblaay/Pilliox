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
import { notificationService } from "../services/notificationService";

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
    setPills((prev) => prev.filter((p) => p.id !== pillId));
    setEditingPill(null);
    setIsAddingNew(false);
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
                    <div key={pill.id} className="flex items-center">
                      <Button
                        variant="menuItem"
                        hideChevron
                        className="flex-1"
                        onClick={() => {
                          setEditingPill({ ...pill });
                          setIsAddingNew(false);
                          setEditModalOpen(true);
                        }}
                      >
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color || "#a855f7" }} />
                        <span className="flex-1 font-medium text-foreground">
                          {pill.name || t("pillsSettings.medicationPlaceholder") || "Medication"}
                        </span>
                        <div className="flex items-center text-sm gap-2 text-muted-foreground">
                          <Pill className="h-4 w-4" />
                          <span>{pill.defaultDosage}</span>
                        </div>
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <span>{pill.notificationTime && ` ${pill.notificationTime}`}</span>
                          </div>
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
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
                        hideChevron
                        className="flex-1"
                        onClick={() => {
                          setEditingPill({ ...pill });
                          setIsAddingNew(false);
                          setEditModalOpen(true);
                        }}
                      >
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color || "#a855f7" }} />
                        <span className="flex-1 font-medium text-foreground">
                          {pill.name || t("pillsSettings.medicationPlaceholder") || "Medication"}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Droplet className="h-4 w-4" />
                          <span>{pill.defaultDosage}{pill.unit ? ` ${pill.unit}` : ""}</span>
                        </div>
                        {pill.notificationsEnabled ? (
                          <div className="flex items-center text-sm gap-2">
                            <Bell className="size-3 text-blue-500" />
                            <span>{pill.notificationTime && ` ${pill.notificationTime}`}</span>
                          </div>
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
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

      <MedicationEditDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        pill={editingPill}
        isAddingNew={isAddingNew}
        userId={userId}
        projectId={projectId}
        anonKey={anonKey}
        accessToken={accessToken}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onDiscard={handleDiscard}
      />
    </div>
  );
}
