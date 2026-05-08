import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { getSupabaseClient } from "../../../utils/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { LanguageSelector } from "./LanguageSelector";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Vector from "../../imports/Vector";
import svgPaths from "../../imports/svg-hepzwgk5tt";
import { Logo } from "../components/Logo";
import { Alert } from "./ui/alert";

interface AuthFormProps {
  onAuthSuccess: (
    accessToken: string,
    userEmail: string,
    refreshToken?: string,
  ) => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export function AuthForm({
  onAuthSuccess,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: AuthFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "login" | "signup"
  >("signup"); // 🔥 DEFAULT TO SIGNUP - Most users need to create account first
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupDateOfBirth, setSignupDateOfBirth] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Use a single generic error message for all login failures
        setError(t("auth.invalidLoginCredentials"));
        setIsLoading(false);
        return;
      }

      if (data?.access_token) {
        onAuthSuccess(data.access_token, loginEmail, data.refresh_token);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            name: signupName,
            dateOfBirth: signupDateOfBirth || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if email already exists
        if (
          data.error &&
          data.error.includes("already been registered")
        ) {
          setError(
            `This email is already registered. Please use "Login" tab or reset your password if you forgot it.`,
          );

          // Auto-switch to login tab after 3 seconds
          setTimeout(() => {
            setActiveTab("login");
            setLoginEmail(signupEmail);
            setLoginPassword(signupPassword);
            setError("");
          }, 3000);
        } else {
          setError(data.error || "Signup failed");
        }
        setIsLoading(false);
        return;
      }

      if (data?.access_token) {
        onAuthSuccess(data.access_token, signupEmail);
      }
    } catch (err: any) {
      setError(
        err.message ||
        "Signup failed. Please check console for details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        },
      });

      console.log("[auth] signInWithOAuth — provider:", provider, "redirectTo:", `${window.location.origin}/app`, "error:", error?.message, "url:", data?.url?.slice(0, 80));

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || `${provider} login failed`);
      setIsLoading(false);
    }
  };

  const openBrowser = async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-full bg-input-background dark:bg-[#0a0a0a] flex gap-4 flex-col md:items-center md:justify-center p-4 py-8 md:py-4 relative">
      {/* Back to Landing Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/home")}
        className="mx-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("auth.backToHome") || "Back to Home"}
      </Button>

      <div className="flex max-h-auto flex-col md:flex-row w-full max-w-[800px] rounded-[16px] overflow-hidden shadow-2xl">
        {/* Left Side - Decorative Panel (Desktop sidebar / Mobile top) */}
        <div className="relative w-full md:w-[320px] hidden lg:flex bg-primary dark:bg-popover flex-col gap-2 p-6 order-first">
          {/* Background Image with Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
          >
            <img
              alt=""
              className="absolute max-w-none object-cover size-full"
              src="src/assets/bg.png"
              style={{ filter: "grayscale(1)" }}
            />
            <div className="absolute bg-popover/80  inset-0" />
          </div>

          {/* Calendar Preview Image 
          <div className="absolute h-[361px] left-[32px] bottom-[-100px] w-[249px] rotate-[5deg] hidden md:block">
            <img
              alt="Calendar preview"
              className="absolute inset-0 max-w-none object-cover pointer-events-none size-full rounded-lg"
              src={imgImage1}
            />
          </div>*/}

          {/* Feature List */}
          <ul className="relative space-y-4 text-l">
            <li>
              <h1>{t("auth.features.title")}</h1>
            </li>
            <li className="flex items-start gap-2">
              • {t("auth.features.medications")}
            </li>
            <li className="flex items-start gap-2">
              • {t("auth.features.inrTracking")}
            </li>
            <li className="flex items-start gap-2">
              • {t("auth.features.colorCoded")}
            </li>
            <li className="flex items-start gap-2">
              • {t("auth.features.notes")}
            </li>
          </ul>
        </div>

        {/* Right Side - Auth Card */}
        <div className="flex-1 md:h-auto bg-popover p-4 md:p-8 flex flex-col gap-4">


          <div className="flex w-full">
            {/* Logo */}
            <div className="flex-1">
            <Logo className="h-[40px] w-[120px] flex-0" />
            </div>
            {/* Language Selector */}
            <LanguageSelector variant="ghost" className="flex-0" />
          </div>

          {/* Tab Buttons */}
          <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-[20px] p-1 mb-4 flex gap-0">
            <Button
              variant="tabGroup"
              onClick={() => setActiveTab("login")}
              data-state={
                activeTab === "login" ? "active" : "inactive"
              }
              className="flex-1"
            >
              {t("auth.login")}
            </Button>
            <Button
              variant="tabGroup"
              onClick={() => setActiveTab("signup")}
              data-state={
                activeTab === "signup" ? "active" : "inactive"
              }
              className="flex-1"
            >
              {t("auth.signup")}
            </Button>
          </div>

          {/* Login Form */}              {/* Social Login Buttons */}
          <div className="flex flex-col gap-3">


            {/* OAuth Buttons */}
            <div className="flex gap-3">
              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin("google")}
                disabled={isLoading}
                className="flex-1"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              {/* Facebook Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin("facebook")}
                disabled={isLoading}
                className="flex-1"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>

            </div>
            {/* Divider with "OR" text */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative px-4 bg-popover">
                <span className="text-sm text-[#888]">
                  {t("auth.orContinueWith")}
                </span>
              </div>
            </div>
          </div>
          {activeTab === "login" && (
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="login-email"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.email")}
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={loginEmail}
                  onChange={(e) =>
                    setLoginEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="login-password"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder")}
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(e.target.value)
                    }
                    required
                    autoComplete="current-password"
                  />
                  {/* Show password button */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Forgot Password Link */}
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate("/forgot-password")}
                    size="link"
                    className="!text-sm p-0"
                  >
                    {t("auth.forgotPassword")}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("auth.loggingIn")
                  : t("auth.login")}
              </Button>
            </form>
          )}

          {/* Signup Form */}

          {activeTab === "signup" && (
            <form
              onSubmit={handleSignup}
              className="flex flex-col gap-6"
            >
              {/* Name Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="signup-name"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.name")}
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder={t("auth.namePlaceholder")}
                  value={signupName}
                  onChange={(e) =>
                    setSignupName(e.target.value)
                  }
                  autoComplete="name"
                />
              </div>

              {/* Date of Birth Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="signup-dob"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("profile.dateOfBirth") || "Date of Birth"}{" "}

                </label>
                <Input
                  id="signup-dob"
                  type="date"
                  value={signupDateOfBirth}
                  onChange={(e) => setSignupDateOfBirth(e.target.value)}
                  autoComplete="bday"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="signup-email"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.email")}
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={signupEmail}
                  onChange={(e) =>
                    setSignupEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="signup-password"
                  className="text-gray-900 dark:text-white text-sm font-medium"
                >
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t(
                      "auth.passwordPlaceholderDots",
                    )}
                    value={signupPassword}
                    onChange={(e) =>
                      setSignupPassword(e.target.value)
                    }
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />

                  {/* Show password button */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Signup Button */}
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("auth.signingUp")
                  : t("auth.signupButton")}
              </Button>
            </form>
          )}



          {/* Legal Links */}
          <div className="text-center text-gray-500 dark:text-[#888] text-sm mt-2">
            <span>{t("auth.bySigningUp")} </span>
            {onNavigateToTerms && (
              <>
                <Button
                  type="button"
                  onClick={onNavigateToTerms}
                  variant="link"
                  size="link"
                  className="!text-sm px-0.5"
                >
                  {t("auth.termsOfService")}
                </Button>
                <span> {t("auth.and")} </span>
              </>
            )}
            {onNavigateToPrivacy && (
              <Button
                type="button"
                onClick={onNavigateToTerms}
                variant="link"
                size="link"
                className="!text-sm px-0.5"
              >
                {t("auth.privacyPolicy")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}