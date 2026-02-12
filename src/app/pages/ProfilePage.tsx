import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Alert,
  AlertDescription,
} from "../components/ui/alert";
import {
  User,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  ArrowLeft,
  Lock,
  KeyRound,
  ChevronRight,
  LogOut,
  CreditCard,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { BottomNavigation } from "../components/BottomNavigation";

interface ProfilePageProps {
  accessToken: string;
  userEmail: string;
  projectId: string;
  anonKey: string;
  onLogout: () => void;
}

export function ProfilePage({
  accessToken,
  userEmail,
  projectId,
  anonKey,
  onLogout,
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

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] =
    useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

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

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError(
        t("profile.passwordTooShort") ||
          "Password must be at least 6 characters",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        t("profile.passwordMismatch") ||
          "Passwords do not match",
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify({ newPassword }),
        },
      );

      if (response.ok) {
        setPasswordSuccess(
          t("profile.passwordChanged") ||
            "Password changed successfully",
        );
        setNewPassword("");
        setConfirmPassword("");
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        const data = await response.json();
        setPasswordError(
          data.error ||
            t("profile.passwordChangeFailed") ||
            "Failed to change password",
        );
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordError(
        t("profile.passwordChangeFailed") ||
          "Failed to change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        t("settings.clearData.confirm") ||
          "Are you sure you want to clear all calendar data? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/user/data`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );

      if (response.ok) {
        // Clear localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith("calendarEntries_")) {
            localStorage.removeItem(key);
          }
        }
        alert(
          t("settings.clearData.success") ||
            "All data cleared successfully",
        );
      }
    } catch (error) {
      console.error("Failed to clear data:", error);
      alert(
        t("settings.clearData.error") || "Failed to clear data",
      );
    }
  };

  const navigate = useNavigate();

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

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("settings.account.title") || "Account"}
          </h2>
          <Card className="divide-y divide-border">
            {/* Subscription */}
            <Button
              variant="menuItem"
              onClick={() => navigate("/app/subscription")}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {t("settings.subscription") || "Subscription"}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Clear Data */}
            <Button
              variant="menuItem"
              onClick={handleClearData}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {t("settings.clearData.title") ||
                    "Clear All Data"}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("profile.security.title") || "Security"}
          </h2>
          <Card className="divide-y divide-border">
            {/* Change Password */}
            <div>
              {!showPasswordForm ? (
                <Button
                  variant="menuItem"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {t("settings.changePassword") ||
                        "Change Password"}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-md">
                        {t("settings.changePassword") ||
                          "Change Password"}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                        setPasswordSuccess("");
                      }}
                    >
                      {t("calendar.cancel") || "Cancel"}
                    </Button>
                  </div>

                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {passwordError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {passwordSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="new-password">
                      {t("profile.newPassword") ||
                        "New Password"}
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder={
                        t("profile.newPasswordPlaceholder") ||
                        "Enter new password"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      {t("profile.confirmPassword") ||
                        "Confirm Password"}
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder={
                        t(
                          "profile.confirmPasswordPlaceholder",
                        ) || "Confirm new password"
                      }
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full"
                  >
                    {isChangingPassword
                      ? t("profile.changing") || "Changing..."
                      : t("profile.changePasswordButton") ||
                        "Change Password"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("settings.logout") || "Logout"}
          </Button>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}