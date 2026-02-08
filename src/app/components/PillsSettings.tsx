import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Pill,
  Plus,
  Trash2,
  Save,
  Droplet,
  X,
} from "lucide-react";
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
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";

export interface PillSetting {
  id: string;
  name: string;
  defaultDosage: number;
  color?: string;
  type?: "pills" | "value";
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

  useEffect(() => {
    if (open && userId) {
      loadPillsSettings();
    }
  }, [open, userId]);

  const loadPillsSettings = async () => {
    if (!userId) {
      console.error(
        "Cannot load pills settings: userId is empty",
      );
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
        },
      );

      console.log(
        "Pills settings response status:",
        response.status,
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Pills settings loaded:", data);
        setPills(data.pills || []);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to load pills settings:",
          response.status,
          errorText,
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
      console.log(
        "Saving pills settings:",
        JSON.stringify(pills, null, 2),
      );

      for (const pill of pills) {
        console.log(`Validating pill ${pill.id}:`, {
          id: pill.id,
          name: pill.name,
          defaultDosage: pill.defaultDosage,
          defaultDosageType: typeof pill.defaultDosage,
        });

        if (
          !pill.id ||
          !pill.name ||
          typeof pill.defaultDosage !== "number" ||
          isNaN(pill.defaultDosage)
        ) {
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
        },
      );

      if (response.ok) {
        toast.success(t("pillsSettings.saveSuccess"));
        onOpenChange(false); // Close the modal after successful save
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
      type: "pills",
    };
    setPills([...pills, newPill]);
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
  };

  const removePill = (id: string) => {
    setPills(pills.filter((pill) => pill.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[800px] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#3a3a3a] p-0">
        <DialogHeader className="px-[17px] pt-[21px] pb-[12px] space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <Pill
              className="h-5 w-5 text-[#9810FA]"
              strokeWidth={1.67}
            />
            <span className="text-[18px] font-semibold text-white tracking-[0.45px] leading-[18px]">
              {t("pillsSettings.title")}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("pillsSettings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-[17px] space-y-3 md:space-y-5">
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
                    {t("pillsSettings.noPills")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col gap-2">
                  {pills.map((pill) => (
                    <div
                      key={pill.id}
                      className="bg-[#1a1a1a] flex flex-col rounded-[10px] border border-[#3a3a3a] gap-4 p-4"
                    >
                      <div className="flex flex-col gap-5 md:flex-row">
                        {/* Name */}
                        <div className="space-y-2 flex-1 flex-row">
                          <Label className="text-[14px] font-medium text-white tracking-[0.35px] leading-[14px]">
                            {t("pillsSettings.medicationName")}
                          </Label>
                          <Input
                            value={pill.name}
                            onChange={(e) =>
                              updatePill(pill.id, {
                                name: e.target.value,
                              })
                            }
                            placeholder={t(
                              "pillsSettings.medicationPlaceholder",
                            )}
                            className="h-12 bg-transparent border-[#555] border-[0.667px] text-white text-base placeholder:text-[#888] rounded-[10px]"
                          />
                        </div>

                        {/* Color */}
                        <div className="space-y-2 flex-1">
                          <Label className="text-[14px] font-medium text-white tracking-[0.35px] leading-[14px]">
                            {t("pillsSettings.color")}
                          </Label>
                          <div className="flex flex-wrap gap-1 w-full">
                            {PILL_COLORS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() =>
                                  updatePill(pill.id, {
                                    color: color.value,
                                  })
                                }
                                className={`flex-1 min-w-0 h-12 rounded-full border-2 transition-all ${
                                  pill.color === color.value
                                    ? "border-[#f3f4f6] scale-105"
                                    : "border-[#364153]"
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
                      <div className="space-y-4 flex flex-col h-auto gap-5 md:flex-row">
                        {/* Type */}
                        <div className="space-y-2 flex-1">
                          <Label className="text-[14px] font-medium text-white tracking-[0.35px] leading-[14px]">
                            {t("pillsSettings.type")}
                          </Label>

                          <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-[14px] p-[3px] flex gap-0">
                            <Button
                              size="sm"
                              type="button"
                              variant="tabGroup"
                              data-state={
                                (pill.type || "pills") ===
                                "pills"
                                  ? "active"
                                  : "inactive"
                              }
                              onClick={() =>
                                updatePill(pill.id, {
                                  type: "pills",
                                })
                              }
                            >
                              <Pill
                                className="h-4 w-4"
                                strokeWidth={1.33}
                              />
                              <span className="text-[14px] font-medium tracking-[0.35px] leading-5">
                                {t("pillsSettings.typePills")}
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="tabGroup"
                              data-state={
                                (pill.type || "pills") ===
                                "value"
                                  ? "active"
                                  : "inactive"
                              }
                              onClick={() =>
                                updatePill(pill.id, {
                                  type: "value",
                                })
                              }
                            >
                              <Droplet
                                className="h-4 w-4"
                                strokeWidth={1.33}
                              />
                              <span className="text-[14px] font-medium tracking-[0.35px] leading-5">
                                {t("pillsSettings.typeValue")}
                              </span>
                            </Button>
                          </div>
                        </div>

                        {/* Default Dosage with Delete Button */}
                        <div className="flex gap-5 flex-1 items-end">
                          <div className="flex-1">
                            <Label>
                              {(pill.type || "pills") ===
                              "pills"
                                ? t(
                                    "pillsSettings.defaultDosage",
                                  )
                                : t(
                                    "pillsSettings.defaultValue",
                                  )}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step={
                                (pill.type || "pills") ===
                                "pills"
                                  ? "0.5"
                                  : "0.01"
                              }
                              value={pill.defaultDosage}
                              onChange={(e) =>
                                updatePill(pill.id, {
                                  defaultDosage:
                                    parseFloat(
                                      e.target.value,
                                    ) || 0,
                                })
                              }
                              className="h-12 bg-transparent border-[#555] border-[0.667px] text-white text-base rounded-[10px]"
                            />
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={() => removePill(pill.id)}
                            className="flex-0"
                          >
                            <Trash2
                              className="h-6 w-6"
                              strokeWidth={2}
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Medication Button */}
              <button
                type="button"
                onClick={addPill}
                className="w-full h-10 md:h-12 rounded-[14px] border border-[#2a2a2a] bg-[rgba(42,42,42,0.3)] flex items-center justify-center gap-2 text-white hover:bg-[rgba(42,42,42,0.5)] transition-colors"
              >
                <Plus
                  className="h-5 w-5 md:h-6 md:w-6"
                  strokeWidth={2}
                />
                <span className="text-[14px] md:text-base font-medium tracking-[0.4px] leading-6">
                  {t("pillsSettings.addMedication")}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#3a3a3a] px-[17px] pt-[16.667px] pb-[21px] flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("pillsSettings.cancel")}
          </Button>
          <Button
            onClick={savePillsSettings}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t("pillsSettings.saving")}
              </>
            ) : (
              <>
                <Save className="h-6 w-6" strokeWidth={2} />
                <span className="hidden md:inline">
                  {t("pillsSettings.save")}
                </span>
                <span className="md:hidden">
                  {t("pillsSettings.save")}
                </span>
              </>
            )}
          </Button>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}