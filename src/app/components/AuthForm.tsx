import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import imgFrame3 from "figma:asset/d4750969fc6e1ecdb0e81241cf229682cfd97a4a.png";
import imgImage1 from "figma:asset/84229552ad15a973e3ff4d1f571f1de3e034300c.png";

interface AuthFormProps {
  onAuthSuccess: (
    accessToken: string,
    userEmail: string,
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
  >("login");
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

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
        // Show more helpful error messages from the backend
        const errorMessage = data.error || "Login failed";
        
        if (data.code === 'invalid_credentials') {
          // Check if user exists
          try {
            const checkResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/check-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({ email: loginEmail }),
              }
            );
            
            const checkData = await checkResponse.json();
            
            if (checkData.exists) {
              // User exists but password is wrong
              setError(`Incorrect password.\n\nIf you forgot your password, use a different password or contact support.`);
            } else {
              // User doesn't exist
              setError(`Account not found. Please sign up first.\n\nRedirecting to Sign Up in 3 seconds...`);
              
              // Auto-switch to signup tab after 3 seconds
              setTimeout(() => {
                setActiveTab('signup');
                setSignupEmail(loginEmail);
                setSignupPassword(loginPassword);
                setError('');
              }, 3000);
            }
          } catch (checkError) {
            // Fallback if check fails
            setError(`${errorMessage}\n\nPlease check your credentials or sign up if you don't have an account.`);
          }
        } else {
          setError(errorMessage);
        }
        
        setIsLoading(false);
        return;
      }

      if (data?.access_token) {
        onAuthSuccess(data.access_token, loginEmail);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
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
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if email already exists
        if (data.error && data.error.includes('already been registered')) {
          setError(`This email is already registered. Please use "Login" tab or reset your password if you forgot it.`);
          
          // Auto-switch to login tab after 3 seconds
          setTimeout(() => {
            setActiveTab('login');
            setLoginEmail(signupEmail);
            setLoginPassword(signupPassword);
            setError('');
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

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/app`,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (err: any) {
      setError(err.message || "Google login failed");
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // If successful, user will be redirected
    } catch (err: any) {
      setError(err.message || "Facebook login failed");
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
    <div className="min-h-full bg-input dark:bg-[#0a0a0a] flex gap-4 flex-col md:items-center md:justify-center p-4 py-8 md:py-4 relative">
      {/* Back to Landing Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="mx-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </Button>

      <div className="flex max-h-auto flex-col md:flex-row w-full max-w-[800px] rounded-[16px] overflow-hidden shadow-2xl">
        {/* Left Side - Decorative Panel (Desktop sidebar / Mobile top) */}
        <div className="flex relative w-full md:w-[320px] bg-gray-200 dark:bg-gray-800 flex-col gap-2 p-6 order-first">
          {/* Background Image with Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
          >
            <img
              alt=""
              className="absolute max-w-none object-cover size-full"
              src={imgFrame3}
            />
            <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0" />
          </div>

          {/* Calendar Preview Image */}
          <div className="absolute h-[361px] left-[32px] bottom-[-100px] w-[249px] rotate-[5deg] hidden md:block">
            <img
              alt="Calendar preview"
              className="absolute inset-0 max-w-none object-cover pointer-events-none size-full rounded-lg"
              src={imgImage1}
            />
          </div>

          {/* Feature List */}
          <ul className="relative space-y-4 !text-white text-l">
            <li>
              <h1 className="font-bold">
                {t("auth.features.title")}
              </h1>
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
        <div className="flex-1 md:h-auto bg-input-background p-4 md:p-8 flex flex-col gap-4">
          {/* Logo and Tagline */}

          <div className="flex spece-between w-auto">
            <div className="inline-flex flex-col items-start gap-2 flex-1 w-auto">
              <div className="h-[40px] w-[120px]">
                <Vector />
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex-0 justify-center">
              <LanguageSelector variant="ghost" />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            {/* Google Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="secondary"
              className="flex-1"
            >
              {/* Google Icon */}
              <div className="relative shrink-0 size-5">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 16.8902 17.4926"
                >
                  <g>
                    <path
                      clipRule="evenodd"
                      d={svgPaths.p3f20ec00}
                      fill="#F44336"
                      fillRule="evenodd"
                      opacity="0.987"
                    />
                    <path
                      clipRule="evenodd"
                      d={svgPaths.p15800}
                      fill="#FFC107"
                      fillRule="evenodd"
                      opacity="0.997"
                    />
                    <path
                      clipRule="evenodd"
                      d={svgPaths.p21d1cc20}
                      fill="#448AFF"
                      fillRule="evenodd"
                      opacity="0.999"
                    />
                    <path
                      clipRule="evenodd"
                      d={svgPaths.p1af26300}
                      fill="#43A047"
                      fillRule="evenodd"
                      opacity="0.993"
                    />
                  </g>
                </svg>
              </div>
              Google
            </Button>

            {/* Facebook Button */}
            <Button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isLoading}
              variant="secondary"
              className="flex-1"
            >
              {/* Facebook Icon */}
              <div className="relative shrink-0 size-5">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 20 20"
                >
                  <g clipPath="url(#clip0_35_74)">
                    <path
                      d={svgPaths.p3ef31c80}
                      fill="#1877F2"
                    />
                    <path d={svgPaths.p1634fa00} fill="white" />
                  </g>
                  <defs>
                    <clipPath id="clip0_35_74">
                      <rect
                        fill="white"
                        height="20"
                        width="20"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              Facebook
            </Button>
          </div>

          {/* Divider - Removed social login for now */}
          <div className="text-center text-gray-500 dark:text-[#888] text-sm">
            {t("auth.orContinueWith")}
          </div>

          {/* Tab Buttons */}
          <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
            <Button
              variant="tabGroup"
              size="sm"
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
              size="sm"
              onClick={() => setActiveTab("signup")}
              data-state={
                activeTab === "signup" ? "active" : "inactive"
              }
              className="flex-1"
            >
              {t("auth.signup")}
            </Button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-6"
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
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm">
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
                <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm">
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

          {/* Social Login Buttons */}

          {/* Legal Links */}
          <div className="text-center text-gray-500 dark:text-[#888] text-sm mt-2">
            <span>{t("auth.bySigningUp")} </span>
            {onNavigateToTerms && (
              <>
                <button
                  type="button"
                  onClick={onNavigateToTerms}
                  className="text-blue-600 cursor-pointer !text-sm dark:text-blue-400 hover:underline"
                >
                  {t("auth.termsOfService")}
                </button>
                <span> {t("auth.and")} </span>
              </>
            )}
            {onNavigateToPrivacy && (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="text-blue-600 cursor-pointer !text-sm dark:text-blue-400 hover:underline"
              >
                {t("auth.privacyPolicy")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}