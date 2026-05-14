import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { getSupabaseClient } from "../../../utils/supabase/client";
import { LanguageSelector } from "./LanguageSelector";
import { Input } from "./ui/input";
import { Logo } from "../components/Logo";
import { useTheme } from "../hooks/useTheme";

interface AuthFormProps {
  onAuthSuccess: (
    accessToken: string,
    userEmail: string,
    refreshToken?: string,
  ) => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

// ── Calendar preview ──────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
// May 2026 starts on Friday → 4 leading empty cells (Mon–Thu)
const MAY_LEADING = 4;

function CalendarPreview() {
  return (
    <div className="mt-9 rounded-[18px] border border-black/10 dark:border-white/10 bg-card p-[18px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.4)]">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <span className="text-sm font-medium">May 2026</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          42-day streak · 3 meds
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 pt-2.5">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] text-muted-foreground pb-1"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: MAY_LEADING }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {Array.from({ length: 31 }).map((_, i) => {
          const day = i + 1;
          const isPast = day < 7;
          const isToday = day === 7;
          return (
            <div
              key={day}
              className={`rounded-md p-1 flex flex-col justify-between ${
                isToday
                  ? "bg-blue-500/15 border border-blue-500"
                  : ""
              }`}
              style={{ minHeight: 36 }}
            >
              <span
                className={`text-[10px] leading-none ${
                  isToday
                    ? "font-semibold text-foreground"
                    : isPast
                    ? "text-foreground/75"
                    : "text-muted-foreground/40"
                }`}
              >
                {day}
              </span>
              {isPast || isToday ? (
                day === 4 ? (
                  <div className="flex gap-0.5 mt-1">
                    <div className="h-1 flex-1 rounded-full bg-blue-500" />
                    <div className="h-1 flex-1 rounded-full bg-orange-500" />
                  </div>
                ) : (
                  <div className="h-1 w-full rounded-full bg-blue-500 mt-1" />
                )
              ) : (
                <div
                  className="w-full rounded-full border border-dashed border-blue-500/50 mt-1 box-border"
                  style={{ height: 5 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Brand panel ───────────────────────────────────────────────────────────────

function BrandPanel({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <aside
      className="hidden lg:flex flex-col justify-between relative overflow-hidden"
      style={{
        padding: "40px 48px",
        background:
          "linear-gradient(180deg, color-mix(in oklab, #3b82f6 18%, var(--background)) 0%, var(--background) 65%)",
      }}
    >
      {/* Grid line overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(100,100,100,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,.18) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 30% 30%, #000, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 30% 30%, #000, transparent 80%)",
        }}
      />

      {/* Logo */}
      <button
        onClick={onNavigateHome}
        className="relative z-10 flex items-center"
        aria-label="Pilliox home"
      >
        <Logo />
      </button>

      {/* Headline + preview */}
      <div className="relative z-10 max-w-[460px]">
        <h1
          className="font-semibold leading-[1.05] tracking-[-0.035em] mb-4 text-balance text-foreground"
          style={{ fontSize: "clamp(36px, 4.2vw, 54px)" }}
        >
          Welcome back to your{" "}
          <em className="not-italic text-blue-400">routine.</em>
        </h1>
        <p className="text-muted-foreground text-base max-w-[380px]">
          Pick up exactly where you left off — your calendar, your reminders,
          your streak.
        </p>
        <CalendarPreview />
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center gap-3.5 font-mono text-xs text-muted-foreground/55">
        <span>EN · DE · PL</span>
        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
        <span>3-day free trial</span>
        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
        <span>No credit card</span>
      </div>
    </aside>
  );
}

// ── OAuth buttons ─────────────────────────────────────────────────────────────

function OAuthButton({
  provider,
  onClick,
  disabled,
}: {
  provider: "google" | "facebook";
  onClick: () => void;
  disabled: boolean;
}) {
  const label =
    provider === "google" ? "Continue with Google" : "Continue with Facebook";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2.5 w-full py-[11px] px-4 rounded-[11px] border border-black/14 dark:border-white/14 bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      {provider === "google" ? (
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.3 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 40.6 16.2 45 24 45z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.9 36 45 30.5 45 24c0-1.4-.1-2.5-.4-3.5z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 text-muted-foreground/55 text-[11px] font-mono tracking-[0.08em] uppercase">
      <div className="flex-1 h-px bg-border" />
      {label}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 px-4 py-3 rounded-xl text-sm whitespace-pre-line">
      {message}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-[13px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14.5px] font-medium transition-colors shadow-[0_8px_24px_-10px_rgba(59,130,246,.6)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuthForm({
  onAuthSuccess,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: AuthFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme("system");

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupDateOfBirth, setSignupDateOfBirth] = useState("");

  const switchTab = (tab: "login" | "signup") => {
    setError("");
    setActiveTab(tab);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

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
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
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
        if (data.error && data.error.includes("already been registered")) {
          setError(
            `This email is already registered. Please use "Sign in" or reset your password.`,
          );
          setTimeout(() => {
            switchTab("login");
            setLoginEmail(signupEmail);
            setLoginPassword(signupPassword);
          }, 3000);
        } else {
          setError(data.error || "Signup failed");
        }
        setIsLoading(false);
        return;
      }
      if (data?.access_token) {
        onAuthSuccess(data.access_token, signupEmail, data.refresh_token);
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
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
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || `${provider} login failed`);
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-2 bg-background">
      {/* ── LEFT: Brand panel ── */}
      <BrandPanel onNavigateHome={() => navigate("/home")} />

      {/* ── RIGHT: Form panel ── */}
      <main className="flex flex-col justify-center items-center relative min-h-[100dvh] lg:min-h-0 px-6 py-12 lg:px-14">
        {/* Top-right controls */}
        <div className="absolute top-7 right-6 lg:right-10 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors hidden sm:block"
          >
            ← {t("auth.backToHome") || "Back to site"}
          </button>
          {/* Theme toggle */}
          <div className="flex p-1 border border-border rounded-full bg-card">
            <button
              onClick={() => setTheme("dark")}
              aria-label="Dark theme"
              className={`w-7 h-7 rounded-full grid place-items-center transition-colors ${
                isDark ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <Moon className="h-3 w-3" />
            </button>
            <button
              onClick={() => setTheme("light")}
              aria-label="Light theme"
              className={`w-7 h-7 rounded-full grid place-items-center transition-colors ${
                !isDark ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <Sun className="h-3 w-3" />
            </button>
          </div>
          <LanguageSelector variant="ghost" />
        </div>

        {/* Form wrap */}
        <div className="w-full max-w-[420px]">
          {/* Tab switcher */}
          <div className="inline-flex p-1 bg-card border border-border rounded-xl mb-7">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-[18px] py-[9px] rounded-[8px] text-[13.5px] font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login"
                  ? t("auth.login") || "Sign in"
                  : t("auth.signup") || "Create account"}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {activeTab === "login" && (
            <>
              <div className="mb-7">
                <h2 className="text-[32px] font-semibold tracking-[-0.025em] leading-[1.05] mb-1.5 text-foreground">
                  Sign in to Pilliox
                </h2>
                <p className="text-muted-foreground text-[14.5px]">
                  New here?{" "}
                  <button
                    onClick={() => switchTab("signup")}
                    className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
                  >
                    Create an account
                  </button>{" "}
                  — 3 days free.
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-1">
                <OAuthButton
                  provider="google"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isLoading}
                />
                <OAuthButton
                  provider="facebook"
                  onClick={() => handleOAuthLogin("facebook")}
                  disabled={isLoading}
                />
              </div>

              <Divider label={t("auth.orContinueWith") || "or with email"} />

              <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                <Field label={t("auth.email") || "Email"}>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>

                <Field label={t("auth.password") || "Password"}>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      {t("auth.forgotPassword") || "Forgot password?"}
                    </button>
                  </div>
                </Field>

                {error && <ErrorBanner message={error} />}

                <PrimaryButton disabled={isLoading}>
                  {isLoading ? (t("auth.loggingIn") || "Signing in…") : "Sign in"}
                  {!isLoading && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  )}
                </PrimaryButton>
              </form>
            </>
          )}

          {/* ── SIGN UP ── */}
          {activeTab === "signup" && (
            <>
              <div className="mb-7">
                <h2 className="text-[32px] font-semibold tracking-[-0.025em] leading-[1.05] mb-1.5 text-foreground">
                  Create your account
                </h2>
                <p className="text-muted-foreground text-[14.5px]">
                  3 days free. No credit card. Already have one?{" "}
                  <button
                    onClick={() => switchTab("login")}
                    className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
                  >
                    Sign in
                  </button>
                  .
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-1">
                <OAuthButton
                  provider="google"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isLoading}
                />
                <OAuthButton
                  provider="facebook"
                  onClick={() => handleOAuthLogin("facebook")}
                  disabled={isLoading}
                />
              </div>

              <Divider label={t("auth.orContinueWith") || "or with email"} />

              <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                <Field label={t("auth.name") || "Display name"}>
                  <Input
                    type="text"
                    placeholder="What should we call you?"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>

                <Field label={t("auth.email") || "Email"}>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>

                {/* Password + DOB side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("auth.password") || "Password"}>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field label={t("profile.dateOfBirth") || "Date of birth"}>
                    <Input
                      type="date"
                      value={signupDateOfBirth}
                      onChange={(e) => setSignupDateOfBirth(e.target.value)}
                      autoComplete="bday"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                </div>

                {error && <ErrorBanner message={error} />}

                <PrimaryButton disabled={isLoading}>
                  {isLoading
                    ? (t("auth.signingUp") || "Creating account…")
                    : (t("auth.signupButton") || "Start 3-day free trial")}
                  {!isLoading && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  )}
                </PrimaryButton>
              </form>
            </>
          )}

          {/* Legal */}
          <p className="!text-sm text-muted-foreground text-center mt-5 leading-relaxed">
            {t("auth.bySigningUp") || "By continuing you agree to our"}{" "}
            {onNavigateToTerms && (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="underline !text-sm  underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                {t("auth.termsOfService") || "Terms"}
              </button>
            )}
            {onNavigateToTerms && onNavigateToPrivacy && (
              <span> {t("auth.and") || "and"} </span>
            )}
            {onNavigateToPrivacy && (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="underline !text-sm  underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                {t("auth.privacyPolicy") || "Privacy Policy"}
              </button>
            )}
            {". "}{t("auth.neverShareMedicalData") || "We never share medical data."}
          </p>
        </div>
      </main>
    </div>
  );
}
