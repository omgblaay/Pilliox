import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getSupabaseClient } from "../../../utils/supabase/client";
import Vector from "../../imports/Vector";
import { LanguageSelector } from "../components/LanguageSelector";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Get the current site URL (works for both local and production)
      const siteUrl = window.location.origin;

      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/reset-password`,
        });

      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || t("auth.resetPasswordError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-blue-950 to-black-700 p-12 flex-col justify-between">
        <div>
          <div className="h-[40px] w-[120px] mb-8">
            <Vector />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {t("auth.resetPassword")}
          </h1>
          <p className="text-blue-100 text-lg">
            {t("auth.resetPasswordDescription")}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 md:h-auto bg-input-background p-4 md:p-8 flex flex-col">
        {/* Mobile Logo and Language Selector */}
        <div className="flex justify-between items-start mb-8 md:mb-12">
          <div className="md:hidden h-[40px] w-[120px]">
            <Vector />
          </div>
          <div className="hidden md:block">
            <LanguageSelector variant="ghost" />
          </div>
          <div className="md:hidden">
            <LanguageSelector variant="ghost" />
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("auth.backToLogin")}</span>
        </button>

        {!emailSent ? (
          <>
            {/* Title */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("auth.forgotPassword")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.forgotPasswordDescription")}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 max-w-md"
            >
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("auth.sending")
                  : t("auth.sendResetLink")}
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t("auth.checkYourEmail")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t("auth.resetLinkSent")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
                {email}
              </p>
              <Button
                onClick={() => navigate("/auth")}
                variant="secondary"
                className="w-full"
              >
                {t("auth.backToLogin")}
              </Button>

              {/* Resend Option */}
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
                {t("auth.didntReceiveEmail")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t("auth.tryAgain")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}