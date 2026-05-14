import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Calendar,
  Check,
  Globe,
  HeartPulse,
  Moon,
  Palette,
  Pill,
  Shield,
  Sparkles,
  Sun,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { LanguageSelector } from "../components/LanguageSelector";
import { Logo } from "../components/Logo";
import { useTheme } from "../hooks/useTheme";
import { supabase } from "../../../utils/supabase/client";
import calendarMockup from "../assets/lightapp.png";
import carePhoto from "../../assets/bg.png";

const pillIcons = [
  "/Pills Icons/SVG.svg",
  "/Pills Icons/SVG-1.svg",
  "/Pills Icons/SVG-2.svg",
  "/Pills Icons/SVG-3.svg",
  "/Pills Icons/SVG-4.svg",
  "/Pills Icons/SVG-5.svg",
];

const doseDays = [
  { day: "05", dose: "2", tone: "bg-violet-600" },
  { day: "07", dose: "INR 4.77", tone: "bg-emerald-600" },
  { day: "09", dose: "0.5", tone: "bg-orange-500" },
  { day: "14", dose: "INR 3.7", tone: "bg-orange-500" },
  { day: "21", dose: "1.5", tone: "bg-violet-600" },
  { day: "23", dose: "2", tone: "bg-indigo-500" },
  { day: "27", dose: "INR 2.7", tone: "bg-emerald-600" },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme("system");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const trustBarItems = [
    t("landing.trustBar.medications"),
    t("landing.trustBar.supplements"),
    t("landing.trustBar.values"),
  ];

  const features = [
    {
      icon: Calendar,
      title: t("landing.features.calendar.title"),
      description: t("landing.features.calendar.description"),
      visual: "calendar",
      className: "lg:col-span-7",
    },
    {
      icon: Pill,
      title: t("landing.features.pills.title"),
      description: t("landing.features.pills.description"),
      visual: "pills",
      className: "lg:col-span-5",
    },
    {
      icon: Palette,
      title: t("landing.features.colors.title"),
      description: t("landing.features.colors.description"),
      visual: "colors",
      className: "lg:col-span-4",
    },
    {
      icon: Shield,
      title: t("landing.features.secure.title"),
      description: t("landing.features.secure.description"),
      visual: "secure",
      className: "lg:col-span-4",
      secureItems: [
        t("landing.features.secure.feature1"),
        t("landing.features.secure.feature2"),
        t("landing.features.secure.feature3"),
      ],
    },
    {
      icon: Globe,
      title: t("landing.features.multilingual.title"),
      description: t("landing.features.multilingual.description"),
      visual: "languages",
      className: "lg:col-span-4",
    },
  ];

  const whyItems = [
    {
      icon: Calendar,
      title: t("landing.why.fastLogging.title"),
      description: t("landing.why.fastLogging.description"),
    },
    {
      icon: Shield,
      title: t("landing.why.yourData.title"),
      description: t("landing.why.yourData.description"),
    },
    {
      icon: HeartPulse,
      title: t("landing.why.realRoutines.title"),
      description: t("landing.why.realRoutines.description"),
    },
  ];

  const pricingFeatures = [
    t("landing.pricing.feature1"),
    t("landing.pricing.feature2"),
    t("landing.pricing.feature3"),
    t("landing.pricing.feature4"),
    t("landing.pricing.feature5"),
    t("landing.pricing.feature6"),
  ];

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f7f7f5] text-[#0e0e12] dark:bg-[#08090b] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#08090b]/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
            aria-label="Pilliox"
          >
            <Logo />
          </button>

          <nav className="hidden items-center gap-8 text-sm text-black/55 dark:text-white/55 md:flex">
            <a href="#features" className="transition hover:text-black dark:hover:text-white">
              {t("landing.nav.features")}
            </a>
            <a href="#care" className="transition hover:text-black dark:hover:text-white">
              {t("landing.nav.why")}
            </a>
            <a href="#pricing" className="transition hover:text-black dark:hover:text-white">
              {t("landing.nav.pricing")}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-9 w-9 text-black/65 hover:bg-black/10 hover:text-black dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {!isLoggedIn && (
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hidden text-black/70 hover:bg-black/10 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
              >
                {t("landing.header.signIn")}
              </Button>
            )}
            <Button
              onClick={() => navigate(isLoggedIn ? "/app" : "/auth")}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              {isLoggedIn
                ? t("landing.header.goToApp")
                : t("landing.header.getStarted")}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="pointer-events-none absolute inset-x-[-20%] top-0 h-[560px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.32),transparent_68%)]" />
          <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 font-mono text-xs text-black/60 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/65">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
                {t("landing.hero.badge")}
              </div>
              <h1 className="mt-6 text-balance sm:!text-[5.6rem] text-5xl font-semibold tracking-[-0.04em] text-[#0e0e12] dark:text-white ">
                {t("landing.hero.title")}{" "}
                <span className="text-blue-400">
                  {t("landing.hero.titleHighlight")}
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-black/58 dark:text-white/58 sm:text-xl">
                {t("landing.hero.description")}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => navigate("/auth")}
                  className="h-12 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-500"
                >
                  {t("landing.hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <span className="text-sm text-black/45 dark:text-white/42">
                  {t("landing.hero.pricing")}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, rotateX: 9, rotateZ: -4 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative min-h-[520px] lg:min-h-[660px]"
            >
              <div className="absolute inset-x-0 bottom-0 top-12 rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.42))] shadow-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
              <img
                src={calendarMockup}
                alt="Pilliox calendar interface"
                className="absolute bottom-24 left-20 w-100 rotate-[4deg]"
              />
              <img
                src={carePhoto}
                alt="Doctor reviewing medication tracking with a patient"
                className="absolute bottom-8 right-0 hidden h-64 w-48 rounded-2xl border border-black/10 object-cover shadow-2xl dark:border-white/12 sm:block lg:h-80 lg:w-56"
              />
              <div className="absolute left-0 top-28 hidden max-w-[220px] rounded-2xl border border-black/10 bg-white/90 p-4 shadow-2xl backdrop-blur dark:border-white/12 dark:bg-[#111217]/90 md:block">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                    <Pill className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t("landing.hero.pillCardName")}</p>
                    <p className="text-xs text-black/45 dark:text-white/45">{t("landing.hero.pillCardTime")}</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-16 left-0 grid w-[260px] grid-cols-4 gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-2xl backdrop-blur dark:border-white/12 dark:bg-[#111217]/90">
                {pillIcons.slice(0, 4).map((icon) => (
                  <MedicationSvgIcon
                    key={icon}
                    src={icon}
                    className="h-11 w-11 rounded-xl bg-black/[0.04] p-2 dark:bg-white/[0.04]"
                  />
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative mt-16 grid gap-3 border-y border-black/10 py-5 dark:border-white/10 sm:grid-cols-3">
            {trustBarItems.map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-lg border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/65"
              >
                <span className="mr-2 text-blue-300">●</span>
                {label}
              </motion.div>
            ))}
          </div>
        </section>

        <section id="features" className="border-t border-black/10 py-20 dark:border-white/10 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-blue-300">
                {t("landing.features.eyebrow")}
              </p>
              <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#0e0e12] dark:text-white sm:text-6xl">
                {t("landing.features.title")}
              </h2>
              <p className="mt-4 text-lg text-black/55 dark:text-white/55">
                {t("landing.features.description")}
              </p>
            </motion.div>

            <div className="mt-12 grid gap-4 lg:grid-cols-12">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`${feature.className} min-h-[300px] overflow-hidden rounded-[18px] border border-black/10 bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#111217] dark:shadow-[0_30px_90px_rgba(0,0,0,0.25)]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                        <feature.icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-xl font-medium text-[#0e0e12] dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-black/55 dark:text-white/50">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <FeatureVisual visual={feature.visual} secureItems={(feature as any).secureItems} />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="care" className="border-t border-black/10 py-20 dark:border-white/10 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <motion.div
              className="relative overflow-hidden rounded-[26px] border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={carePhoto}
                alt="Healthcare professional using Pilliox with a patient"
                className="h-full min-h-[520px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f7f7f5] via-transparent to-transparent dark:from-[#08090b]" />
              <div className="absolute bottom-5 left-5 right-5 ">
                <Logo />
              </div>
            </motion.div>

            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
              >
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-blue-300">
                  {t("landing.why.eyebrow")}
                </p>
                <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#0e0e12] dark:text-white sm:text-6xl">
                  {t("landing.why.title")}
                </h2>
              </motion.div>
              <div className="mt-8 grid gap-4">
                {whyItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: i * 0.1 }}
                    className="flex gap-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/12 text-blue-300">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-medium text-[#0e0e12] dark:text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-black/55 dark:text-white/50">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-black/10 py-20 dark:border-white/10 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
              >
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-blue-300">
                  {t("landing.pricing.eyebrow")}
                </p>
                <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#0e0e12] dark:text-white sm:text-6xl">
                  {t("landing.pricing.title")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg text-black/55 dark:text-white/55">
                  {t("landing.pricing.description")}
                </p>
              </motion.div>
              <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
                {pricingFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/65 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/65"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="rounded-[24px] border border-blue-400/35 bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(255,255,255,0.9))] p-6 shadow-[0_30px_100px_rgba(37,99,235,0.16)] dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(255,255,255,0.04))]"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                  {t("landing.pricing.popular")}
                </span>
              </div>
              <div className="mt-10">
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-semibold tracking-[-0.05em] text-[#0e0e12] dark:text-white">
                    {t("landing.pricing.price")}
                  </span>
                  <span className="pb-2 text-black/45 dark:text-white/45">
                    {t("landing.pricing.perMonth")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-black/55 dark:text-white/55">
                  {t("landing.pricing.trialIncluded")}
                </p>
              </div>
              <Button
                onClick={() => navigate("/auth")}
                className="mt-8 h-12 w-full"
              >
                {t("landing.pricing.cta")}
              </Button>
              <p className="mt-3 text-center text-xs text-black/45 dark:text-white/42">
                {t("landing.pricing.creditCardNote")}
              </p>
              <p className="mt-1 text-center text-xs text-black/35 dark:text-white/32">
                {t("landing.pricing.cancelAnytime")}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-black/10 px-4 py-20 dark:border-white/10 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-blue-600"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-12">
              <div>
                <Sparkles className="h-8 w-8 text-blue-100" />
                <h2 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
                  {t("landing.cta.title")}
                </h2>
                <p className="mt-4 max-w-xl text-blue-50/80">
                  {t("landing.cta.description")}
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="mt-8 h-12 rounded-xl bg-white !text-blue-700 hover:bg-blue-50"
                >
                  {t("landing.cta.button")}
                </Button>
              </div>
              <div className="relative hidden min-h-[280px] lg:block">
                <img
                  src={calendarMockup}
                  alt="Pilliox app preview"
                  className="absolute -bottom-32 right-10 w-100 rotate-[-8deg]"
                />
                <img
                  src="/Frame 25.png"
                  alt="Pilliox logo"
                  className="absolute left-0 top-10 w-80 opacity-95"
                />
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-[#f7f7f5] dark:border-white/10 dark:bg-[#08090b]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <LanguageSelector variant="ghost" className="text-black/70 dark:text-white/70" />
          <p className="text-sm text-black/45 dark:text-white/45">
            {t("landing.footer.copyright")}
          </p>
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/docs/privacy")}
              className="text-sm text-black/45 transition hover:text-black dark:text-white/45 dark:hover:text-white"
            >
              {t("landing.footer.privacy")}
            </button>
            <button
              onClick={() => navigate("/docs/terms")}
              className="text-sm text-black/45 transition hover:text-black dark:text-white/45 dark:hover:text-white"
            >
              {t("landing.footer.terms")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MedicationSvgIcon({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      className={`block text-blue-500 ${className}`}
      aria-hidden="true"
    >
      <span
        className="block h-full w-full bg-current"
        style={{
          maskImage: `url("${src}")`,
          maskPosition: "center",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskImage: `url("${src}")`,
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
        }}
      />
    </span>
  );
}

function FeatureVisual({ visual, secureItems }: { visual: string; secureItems?: string[] }) {
  if (visual === "calendar") {
    return (
      <div className="mt-8 grid grid-cols-7 gap-2">
        {doseDays.map((day) => (
          <div
            key={day.day}
            className="flex min-h-24 flex-col justify-between rounded-xl bg-black/[0.04] p-3 dark:bg-white/[0.04]"
          >
            <span className="text-lg font-medium text-black/75 dark:text-white/80">{day.day}</span>
            <span
              className={`${day.tone} w-fit rounded-md px-2 py-1 text-xs font-medium text-white`}
            >
              {day.dose}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "pills") {
    return (
      <div className="mt-8 grid grid-cols-3 gap-3">
        {pillIcons.map((icon, index) => (
          <div
            key={icon}
            className="rounded-2xl border bg-popover p-4"
          >
            <MedicationSvgIcon src={icon} className="h-14 w-14" />
            <p className="mt-3 font-mono text-xs text-black/45 dark:text-white/45">
              {index % 2 === 0 ? "08:00" : "20:00"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "colors") {
    return (
      <div className="mt-8 flex h-32 items-end gap-3">
        {["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500"].map(
          (color, index) => (
            <div
              key={color}
              className={`${color} flex-1 rounded-2xl`}
              style={{ height: `${58 + index * 12}%` }}
            />
          ),
        )}
      </div>
    );
  }

  if (visual === "secure") {
    const items = secureItems ?? [];
    return (
      <div className="mt-8 rounded-2xl border border-border p-4">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between border-b border-black/10 py-3 last:border-b-0 dark:border-white/10"
          >
            <span className="text-sm text-black/58 dark:text-white/58">{item}</span>
            <Check className="h-4 w-4 text-emerald-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-3 gap-2">
      {["🇬🇧 EN", "🇩🇪 DE", "🇵🇱 PL"].map((language) => (
        <div
          key={language}
          className="rounded-xl border border-border bg-popover p-4 text-center text-sm font-medium text-foreground"
        >
          {language}
        </div>
      ))}
    </div>
  );
}
