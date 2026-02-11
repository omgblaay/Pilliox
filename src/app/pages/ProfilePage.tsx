import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  User,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";

interface ProfilePageProps {
  accessToken: string;
  userEmail: string;
  projectId: string;
  anonKey: string;
}

export function ProfilePage({
  accessToken,
  userEmail,
  projectId,
  anonKey,
}: ProfilePageProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    medicationsTaken: 0,
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
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
      const data = await response.json();
      if (data.user?.name) {
        setName(data.user.name);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadStats = () => {
    // Calculate stats from calendar data in localStorage
    // This is a simplified version - you can enhance it
    try {
      let totalEntries = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("calendarEntries_")) {
          const entries = JSON.parse(
            localStorage.getItem(key) || "{}",
          );
          totalEntries += Object.keys(entries).length;
        }
      }
      setStats((prev) => ({ ...prev, totalEntries }));
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify({ name }),
        },
      );

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-screen-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/app")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1>{t("profile.title") || "Profile"}</h1>
              <p className="small">
                {t("profile.subtitle") ||
                  "Your health information"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      t("profile.namePlaceholder") ||
                      "Your name"
                    }
                    className="font-semibold text-lg"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-foreground">
                    {name || t("profile.noName") || "User"}
                  </h2>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{userEmail}</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving
                    ? t("common.saving") || "Saving..."
                    : t("common.save") || "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  className="flex-1"
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="w-full"
              >
                {t("profile.editProfile") || "Edit Profile"}
              </Button>
            )}
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalEntries}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.stats.entries") ||
                    "Total Entries"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.stats.streak") || "Day Streak"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.medicationsTaken}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.stats.medications") ||
                    "Medications"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Health Info Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("profile.health.title") ||
                "Health Information"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("profile.health.comingSoon") ||
                "INR tracking and blood test history coming soon..."}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}