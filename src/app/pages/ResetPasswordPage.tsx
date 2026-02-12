import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Alert,
  AlertDescription,
} from "../components/ui/alert";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL hash (Supabase format: #access_token=...)
    const hash = location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    
    if (accessToken) {
      setToken(accessToken);
    } else {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ token, newPassword }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {t("auth.resetPassword") || "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("auth.resetPasswordSubtitle") ||
              "Enter your new password below"}
          </p>
        </div>

        {success ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
              <strong>Password reset successful!</strong>
              <br />
              Redirecting to login...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {t("profile.newPassword") || "New Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="pl-10 pr-10"
                  minLength={6}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t("profile.confirmPassword") || "Confirm Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full"
            >
              {isLoading
                ? t("auth.resetting") || "Resetting..."
                : t("auth.resetPasswordButton") || "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              {t("auth.backToLogin") || "Back to Login"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
