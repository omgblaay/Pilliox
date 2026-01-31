import { useState, useEffect } from "react";
import { User, Lock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/app/components/ui/alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/components/ui/tabs";
import { cn } from "@/app/components/ui/utils";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  projectId: string;
  anonKey: string;
  onLogout: () => void;
}

export function ProfileSettings({
  open,
  onOpenChange,
  accessToken,
  projectId,
  anonKey,
  onLogout,
}: ProfileSettingsProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] =
    useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

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

      if (response.ok) {
        const data = await response.json();
        setName(data.user.name || "");
        setEmail(data.user.email || "");
      } else {
        // Failed to load profile
      }
    } catch (error) {
      // Error loading profile
    }
  };

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

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
        setSuccess("Profile updated successfully");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

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
        setSuccess("Password changed successfully");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to change password");
      }
    } catch (error) {
      setError("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );

      if (response.ok) {
        onLogout();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete account");
      }
    } catch (error) {
      setError("Failed to delete account");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <User className="h-6 w-6 text-muted-foreground" />
              {t("profile.title")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("profile.title")}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="profile"
            className="w-full mt-4 m-[0px]"
          >
            <TabsList className="bg-gray-200 dark:bg-[#2a2a2a] rounded-[14px] p-[3px] flex gap-0 w-full h-auto grid-cols-2">
              <TabsTrigger
                value="profile"
                className="flex-1 h-[40px] rounded-[14px] font-medium text-base transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-[#404040] data-[state=active]:text-gray-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:dark:text-[#888]"
              >
                {t("profile.tabs.profile")}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-1 h-[40px] rounded-[14px] font-medium text-base transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-[#404040] data-[state=active]:text-gray-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:dark:text-[#888]"
              >
                {t("profile.tabs.security")}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="profile"
              className="space-y-4 mt-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("profile.namePlaceholder")}
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="email">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("profile.emailNotEditable")}
                  </p>
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                >
                  {isLoading
                    ? t("profile.updating")
                    : t("profile.updateProfile")}
                </Button>

                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-foreground mb-4">
                    <svg
                      className="h-5 w-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <h3 className="font-semibold">
                      {t("profile.signOut")}
                    </h3>
                  </div>

                  <Button
                    onClick={onLogout}
                    variant="secondary"
                    className="w-full"
                  >
                    {t("profile.logoutButton")}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="security"
              className="space-y-4 mt-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-md text-[16px]">
                    {t("profile.changePassword")}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {t("profile.newPassword")}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder={t(
                      "profile.newPasswordPlaceholder",
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {t("profile.confirmPassword")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder={t("profile.confirmPassword")}
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                >
                  {isLoading
                    ? t("profile.changing")
                    : t("profile.changePasswordButton")}
                </Button>

                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
                    <Trash2 className="h-5 w-5" />
                    <h3 className="font-semibold">
                      {t("profile.dangerZone")}
                    </h3>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      size="sm"
                    >
                      {t("profile.deleteAccount")}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
                        <AlertDescription className="text-red-800 dark:text-red-300">
                          {t("profile.deleteWarning")}
                        </AlertDescription>
                      </Alert>

                      <Input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) =>
                          setDeleteConfirmText(e.target.value)
                        }
                        placeholder={t(
                          "profile.deleteConfirmPlaceholder",
                        )}
                      />

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          {t("calendar.cancel")}
                        </Button>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={
                            isLoading ||
                            deleteConfirmText !== "DELETE"
                          }
                          variant="destructive"
                          className="flex-1"
                        >
                          {isLoading
                            ? t("profile.deleting")
                            : t("profile.confirmDelete")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}