import { useState } from "react";
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
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
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
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("auth.forgotPassword") || "Forgot Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.forgotPasswordSubtitle") ||
                "Enter your email to receive a reset link"}
            </p>
          </div>
        </div>

        {success ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
              <strong>Check your email!</strong>
              <br />
              If an account exists with that email, we've sent you a password
              reset link.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder={t("auth.emailPlaceholder") || "your@email.com"}
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? t("auth.sending") || "Sending..."
                : t("auth.sendResetLink") || "Send Reset Link"}
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
