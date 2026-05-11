import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
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
  const PROFILE_CACHE_KEY = "pilliox_profile_cache";
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [savedDateOfBirth, setSavedDateOfBirth] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    medicationsTaken: 0,
  });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] =
    useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswordForm, setShowPasswordForm] =
    useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [isOAuthOnly, setIsOAuthOnly] = useState(false);
  const [isLoadingPasswordStatus, setIsLoadingPasswordStatus] = useState(true);

  useEffect(() => {
    loadProfile();
    loadStats();
    checkPasswordStatus();
  }, []);

  const checkPasswordStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/auth/has-password`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setHasPassword(data.hasPassword);
        setIsOAuthOnly(data.isOAuthOnly);
      }
    } catch (error) {
    } finally {
      setIsLoadingPasswordStatus(false);
    }
  };

  const loadProfile = async () => {
    // Restore from local cache immediately so the UI isn't blank on revisit
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { name: cachedName, dateOfBirth: cachedDob } = JSON.parse(cached);
        if (cachedName) setName(cachedName);
        if (cachedDob) setDateOfBirth(cachedDob);
      }
    } catch {}

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
      // Server values take priority over cache when present
      if (data.user?.name) setName(data.user.name);
      const serverDob = data.user?.dateOfBirth ?? data.user?.date_of_birth;
      if (serverDob) setDateOfBirth(serverDob.split("T")[0]);
    } catch (error) {
    }
  };

  const loadStats = () => {
    try {
      const loggedDates: string[] = [];
      let totalMedications = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith("calendarEntries_")) continue;

        const monthEntries: Record<string, { amount?: string; note?: string; pills?: string; adHocMeds?: string; color?: string; tag?: string }> =
          JSON.parse(localStorage.getItem(key) || "{}");

        for (const [dateKey, entry] of Object.entries(monthEntries)) {
          const hasContent =
            entry.amount || entry.note || entry.color || entry.tag ||
            (entry.pills && JSON.parse(entry.pills).length > 0) ||
            (entry.adHocMeds && JSON.parse(entry.adHocMeds).length > 0);

          if (hasContent) loggedDates.push(dateKey);

          if (entry.pills) {
            try {
              const parsed: { dosage?: number }[] = JSON.parse(entry.pills);
              totalMedications += parsed.reduce((s, p) => s + (p.dosage ?? 1), 0);
            } catch {}
          }
          if (entry.adHocMeds) {
            try {
              totalMedications += (JSON.parse(entry.adHocMeds) as unknown[]).length;
            } catch {}
          }
        }
      }

      // Compute streak: walk back from today counting consecutive logged days
      const dateSet = new Set(loggedDates);
      let streak = 0;
      let cursor = new Date();
      // If today has no entry yet, allow starting streak from yesterday
      if (!dateSet.has(format(cursor, "yyyy-MM-dd"))) {
        cursor = subDays(cursor, 1);
      }
      while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
        streak++;
        cursor = subDays(cursor, 1);
      }

      setStats({ totalEntries: loggedDates.length, currentStreak: streak, medicationsTaken: totalMedications });
    } catch {}
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
          body: JSON.stringify({ name, dateOfBirth: dateOfBirth || undefined }),
        },
      );

      if (response.ok) {
        setSavedName(name);
        setSavedDateOfBirth(dateOfBirth);
        setIsEditing(false);
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ name, dateOfBirth }));
        } catch {}
      }
    } catch (error) {
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
    
    // If user has a password, validate current password is entered
    if (hasPassword && !currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    setIsChangingPassword(true);

    try {
      const body: any = { newPassword };
      if (hasPassword) {
        body.currentPassword = currentPassword;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(
          data.message ||
          t("profile.passwordChanged") ||
            "Password changed successfully",
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Update password status
        setHasPassword(true);
        setIsOAuthOnly(false);
        
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        setPasswordError(
          data.error ||
            t("profile.passwordChangeFailed") ||
            "Failed to change password",
        );
      }
    } catch (error) {
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
      alert(
        t("settings.clearData.error") || "Failed to clear data",
      );
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background">
        <div className="max-w-screen-lg mx-auto px-4 sm:py-8 py-4">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg">{t("profile.title") || "Profile"}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-lg mx-auto px-4 space-y-6">
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
                  <div className="flex flex-col md:flex-row gap-4">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        t("profile.namePlaceholder") || "Your name"
                      }
                      className="font-semibold text-lg"
                    />
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      placeholder={t("profile.dateOfBirth") || "Date of birth (optional)"}
                    />
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-foreground">
                    {name || t("profile.noName") || "User"}
                  </h2>
                )}
                <p className="small flex gap-2 items-center mt-2">
                  <Mail className="size-4" />
                  {userEmail}
                </p>
                {!isEditing && dateOfBirth && (
                  <p className="small flex gap-2 items-center mt-1">
                    <Calendar className="size-4"/>
                    {new Date(dateOfBirth).toLocaleDateString()}
                  </p>
                )}
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
                    setName(savedName);
                    setDateOfBirth(savedDateOfBirth);
                    setIsEditing(false);
                  }}
                  className="flex-1"
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setSavedName(name);
                  setSavedDateOfBirth(dateOfBirth);
                  setIsEditing(true);
                }}
                variant="outline"
                className="w-full"
              >
                {t("profile.editProfile") || "Edit Profile"}
              </Button>
            )}
          </Card>
        </motion.div><motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="divide-y divide-border">
            {/* Subscription */}
            <Button
              variant="menuItem"
              onClick={() => navigate("/app/subscription")}
            >
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              {t("settings.subscription") || "Subscription"}
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
            {t("profile.tabs.security") || "Security"}
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
                    {t("settings.changePassword")}
                  </div>
                </Button>
              ) : (
                <div className="flex flex-col gap-4 p-4">
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
                  
                  {/* OAuth user notice */}
                  {!hasPassword && !isLoadingPasswordStatus && (
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        ✨ You signed up with Google. Set a password to enable email login.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Current Password (only if user has one) */}
                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="current-password">
                        {t("profile.currentPassword") ||
                          "Current Password"}
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) =>
                          setCurrentPassword(e.target.value)
                        }
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
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
                        "Enter new password (min 6 characters)"
                      }
                      minLength={6}
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
                      minLength={6}
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword.length < 6
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
            {/* Clear Data */}
            <Button
              variant="menuItem"
              onClick={handleClearData}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-muted-foreground" />
                {t("settings.clearData.title") ||
                  "Clear All Data"}
              </div>
            </Button>
            {/* Logout */}
            <Button
              variant="menuItem"
              onClick={onLogout}
              hideChevron
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-muted-foreground" />
                {t("settings.logout") || "Logout"}
              </div>
            </Button>
          </Card>
        </motion.div>
        {/* Security */}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}