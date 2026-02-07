import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pill, Plus, Trash2, Save, Droplet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export interface PillSetting {
  id: string;
  name: string;
  defaultDosage: number;
  color?: string;
  type?: 'pills' | 'value'; // Type of medication: pills counter or value input
}

interface PillsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  accessToken: string;
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

export function PillsSettings({
  open,
  onOpenChange,
  userId,
  accessToken,
}: PillsSettingsProps) {
  const { t } = useTranslation();
  const [pills, setPills] = useState<PillSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load pills settings
  useEffect(() => {
    if (open && userId) {
      loadPillsSettings();
    }
  }, [open, userId]);

  const loadPillsSettings = async () => {
    if (!userId) {
      console.error("Cannot load pills settings: userId is empty");
      toast.error(t("pillsSettings.loadError"));
      return;
    }
    
    setLoading(true);
    try {
      console.log("Loading pills settings for userId:", userId);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Token": accessToken,
          },
        }
      );

      console.log("Pills settings response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Pills settings loaded:", data);
        setPills(data.pills || []);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to load pills settings:",
          response.status,
          errorText
        );
        toast.error(t("pillsSettings.loadError"));
      }
    } catch (error) {
      console.error("Error loading pills settings:", error);
      toast.error(t("pillsSettings.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const savePillsSettings = async () => {
    setSaving(true);
    try {
      console.log("Saving pills settings:", JSON.stringify(pills, null, 2));
      
      // Validate pills before sending
      for (const pill of pills) {
        console.log(`Validating pill ${pill.id}:`, {
          id: pill.id,
          name: pill.name,
          defaultDosage: pill.defaultDosage,
          defaultDosageType: typeof pill.defaultDosage,
        });
        
        if (!pill.id || !pill.name || typeof pill.defaultDosage !== 'number' || isNaN(pill.defaultDosage)) {
          console.error("Invalid pill data:", pill);
          toast.error(t("pillsSettings.invalidData"));
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify({ pills }),
        }
      );

      if (response.ok) {
        toast.success(t("pillsSettings.saveSuccess"));
      } else {
        const error = await response.text();
        console.error("Failed to save pills settings:", error);
        toast.error(t("pillsSettings.saveError"));
      }
    } catch (error) {
      console.error("Error saving pills settings:", error);
      toast.error(t("pillsSettings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const addPill = () => {
    const newPill: PillSetting = {
      id: `pill_${Date.now()}`,
      name: "",
      defaultDosage: 1,
      color: PILL_COLORS[0].value,
      type: 'pills', // Default to pills counter
    };
    setPills([...pills, newPill]);
  };

  const updatePill = (id: string, updates: Partial<PillSetting>) => {
    setPills(
      pills.map((pill) => (pill.id === id ? { ...pill, ...updates } : pill))
    );
  };

  const removePill = (id: string) => {
    setPills(pills.filter((pill) => pill.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            {t("pillsSettings.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pillsSettings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-purple-400"></div>
            </div>
          ) : (
            <>
              {pills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("pillsSettings.noPills")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pills.map((pill, index) => (
                    <div
                      key={pill.id}
                      className="flex items-end gap-3 p-4 border rounded-lg bg-card"
                    >
                      <div className="flex-1 space-y-3">
                        {/* Type Selector */}
                        <div className="space-y-2">
                          <Label>{t("pillsSettings.type")}</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updatePill(pill.id, { type: 'pills' })}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                (pill.type || 'pills') === 'pills'
                                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                              }`}
                            >
                              <Pill className="h-4 w-4" />
                              <span className="text-sm font-medium">{t("pillsSettings.typePills")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePill(pill.id, { type: 'value' })}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                pill.type === 'value'
                                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                              }`}
                            >
                              <Droplet className="h-4 w-4" />
                              <span className="text-sm font-medium">{t("pillsSettings.typeValue")}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Medication Name */}
                          <div className="space-y-2">
                            <Label htmlFor={`pill-name-${pill.id}`}>
                              {t("pillsSettings.medicationName")}
                            </Label>
                            <Input
                              id={`pill-name-${pill.id}`}
                              value={pill.name}
                              onChange={(e) =>
                                updatePill(pill.id, { name: e.target.value })
                              }
                              placeholder={t("pillsSettings.medicationPlaceholder")}
                            />
                          </div>

                          {/* Default Dosage */}
                          <div className="space-y-2">
                            <Label htmlFor={`pill-dosage-${pill.id}`}>
                              {(pill.type || 'pills') === 'pills' 
                                ? t("pillsSettings.defaultDosage")
                                : t("pillsSettings.defaultValue")
                              }
                            </Label>
                            <Input
                              id={`pill-dosage-${pill.id}`}
                              type="number"
                              min="0"
                              step={(pill.type || 'pills') === 'pills' ? '0.5' : '0.01'}
                              value={pill.defaultDosage}
                              onChange={(e) =>
                                updatePill(pill.id, {
                                  defaultDosage: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          {/* Color */}
                          <div className="space-y-2">
                            <Label htmlFor={`pill-color-${pill.id}`}>
                              {t("pillsSettings.color")}
                            </Label>
                            <div className="flex gap-2 flex-wrap">
                              {PILL_COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() =>
                                    updatePill(pill.id, { color: color.value })
                                  }
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    pill.color === color.value
                                      ? "border-gray-900 dark:border-gray-100 scale-110"
                                      : "border-gray-300 dark:border-gray-700"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePill(pill.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Pill Button */}
              <Button
                variant="outline"
                onClick={addPill}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("pillsSettings.addMedication")}
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("pillsSettings.cancel")}
          </Button>
          <Button onClick={savePillsSettings} disabled={saving || loading}>
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {t("pillsSettings.saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("pillsSettings.save")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}