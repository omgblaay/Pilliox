import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  ArrowLeft,
  Mail,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { getSupabaseClient } from "../../../utils/supabase/client";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supabase = getSupabaseClient();

  // Step 1: Enter email
  const [step, setStep] = useState<
    "email" | "emailSent" | "verify"
  >("email");
  const [email, setEmail] = useState("");
  const [cameFromEmailLink, setCameFromEmailLink] =
    useState(false); // Track if user came from email link

  // Step 2: Enter OTP + new password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [debugOtp, setDebugOtp] = useState(""); // DEBUG: Remove in production
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown timer in seconds

  // Auto-fill OTP from URL parameter (when user clicks email link)
  useEffect(() => {
    const otpFromUrl = searchParams.get("otp");
    if (otpFromUrl && otpFromUrl.length === 6) {
      console.log("[ForgotPassword] OTP from URL:", otpFromUrl);
      setOtp(otpFromUrl);
      setStep("verify");
      setCameFromEmailLink(true);
    }
  }, [searchParams]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStep("emailSent");
        // DEBUG: Show OTP in UI for testing (remove in production)
        if (data.debug?.otp) {
          setDebugOtp(data.debug.otp);
          console.log("[DEBUG] OTP:", data.debug.otp);
        }
        setResendCooldown(60); // Set cooldown to 60 seconds
      } else {
        setError(data.error || "Failed to send reset code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      // Call backend to verify OTP and reset password
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/auth/verify-reset-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "[ForgotPassword] Verification error:",
          data,
        );
        setError(data.error || "Invalid or expired code");
        setIsLoading(false);
        return;
      }

      console.log("[ForgotPassword] Password reset successful");
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err: any) {
      console.error("[ForgotPassword] Unexpected error:", err);
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-4 lg:p-8">
        <div className="flex flex-col gap-2 mb-6">
          <h1>
            {t("auth.forgotPassword") || "Forgot Password"}
          </h1>
          <p className="small">
            {step === "email"
              ? t("auth.forgotPasswordDescription") ||
                "Enter your email to receive a reset code"
              : step === "emailSent"
                ? t("auth.resetLinkSent") ||
                  "Resetting link sent to your email"
                : t("auth.enterCodeAndPassword") ||
                  "Enter the code from your email and your new password"}
          </p>
        </div>

        {success ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
              <strong>
                {t("auth.passwordResetSuccessful") ||
                  "Password reset successful!"}
              </strong>
              <br />
              {t("auth.redirectingToLogin") ||
                "Redirecting to login..."}
            </AlertDescription>
          </Alert>
        ) : step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("auth.email") || "Email"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    t("auth.emailPlaceholder") ||
                    "your@email.com"
                  }
                  className="pl-10"
                  required
                  autoFocus
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
              disabled={isLoading}
              className="w-full"
            >
              {isLoading
                ? t("auth.sending") || "Sending..."
                : t("auth.sendResetLink") || "Send Reset Code"}
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
        ) : step === "emailSent" ? (
          <div className="space-y-4">
            {t("auth.checkEmailMessage") ||
              "Check your email! We've sent a password reset link to"}{" "}
            <strong>{email}</strong>.{" "}
            {t("auth.checkInboxMessage") ||
              "Please check your inbox and click the link to continue."}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p className="my-4">
                {t("auth.didntReceiveEmail") ||
                  "Didn't receive the email?"}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSendCode}
                className="w-full text-sm"
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? t("auth.resendCodeIn", {
                      seconds: resendCooldown,
                    }) || `Resend Code (${resendCooldown}s)`
                  : t("auth.resendCode") || "Resend Code"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              {t("auth.backToLogin") || "Back to Login"}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="otp">
                {t("auth.resetCode") || "Reset Code"}
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6),
                  )
                }
                placeholder="XXXXXX"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
              />
            </div>

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
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder={
                    t("auth.newPasswordPlaceholder") ||
                    "Enter new password (min 6 characters)"
                  }
                  className="pl-10 pr-10"
                  minLength={6}
                  required
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
                {t("profile.confirmPassword") ||
                  "Confirm Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder={
                    t("auth.confirmPasswordPlaceholder") ||
                    "Confirm new password"
                  }
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
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading
                ? t("auth.resetting") || "Resetting..."
                : t("auth.resetPasswordButton") ||
                  "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleSendCode}
              className="w-full text-sm"
              disabled={isLoading || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? t("auth.resendCodeIn", {
                    seconds: resendCooldown,
                  }) || `Resend Code in ${resendCooldown}s`
                : t("auth.resendCode") || "Resend Code"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}