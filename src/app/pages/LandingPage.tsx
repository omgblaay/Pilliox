import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { useLottie } from "../hooks/useLottie";
import {
  Calendar,
  Pill,
  Palette,
  Shield,
  Globe,
  Check,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTheme } from "../hooks/useTheme";
import Vector from "../../imports/Vector";
import { getSupabaseClient } from "../../../utils/supabase/client";

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const supabase = getSupabaseClient();

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log(
          "Landing page auth check - session:",
          session?.user?.email,
        );
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        "Landing page auth state changed:",
        session?.user?.email,
      );
      setIsLoggedIn(!!session);
      setIsCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Lottie animations - using working LottieFiles URLs
  const healthAnimation = useLottie(
    "https://assets2.lottiefiles.com/packages/lf20_5njp3vgg.json",
  );
  const pillsAnimation = useLottie(
    "https://assets2.lottiefiles.com/packages/lf20_5njp3vgg.json",
  );
  const securityAnimation = useLottie(
    "https://assets10.lottiefiles.com/packages/lf20_myejiggj.json",
  );
  const successAnimation = useLottie(
    "https://assets4.lottiefiles.com/packages/lf20_jbrw3hcz.json",
  );

  const features = [
    {
      icon: Calendar,
      title: t("landing.features.calendar.title"),
      description: t("landing.features.calendar.description"),
    },
    {
      icon: Pill,
      title: t("landing.features.pillCounter.title"),
      description: t(
        "landing.features.pillCounter.description",
      ),
    },
    {
      icon: Palette,
      title: t("landing.features.colorCoded.title"),
      description: t("landing.features.colorCoded.description"),
    },
    {
      icon: Shield,
      title: t("landing.features.secure.title"),
      description: t("landing.features.secure.description"),
    },
    {
      icon: Globe,
      title: t("landing.features.multiLanguage.title"),
      description: t(
        "landing.features.multiLanguage.description",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-[40px] w-auto">
              <Vector />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Language Selector */}
            <LanguageSelector variant="ghost" />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="text-gray-600 dark:text-gray-300"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <Button
                onClick={() => navigate("/app")}
                className="flex-0"
              >
                {t("landing.header.goToApp")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="flex-0"
                >
                  {t("landing.header.signIn")}
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="flex-0"
                >
                  {t("landing.header.getStarted")}
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
        {/* Floating background animations */}
        <div className="absolute top-20 right-10 w-64 h-64 pointer-events-none z-0">
          {healthAnimation.animationData && (
            <Lottie
              animationData={healthAnimation.animationData}
              loop={true}
            />
          )}
        </div>
        <div className="absolute right-0 bottom-0 z-200 w-48 h-48">
          {pillsAnimation.animationData && (
            <Lottie
              animationData={pillsAnimation.animationData}
              loop={true}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {t("landing.hero.title")}
              <br />
              <span className="text-[#9810FA]">
                {t("landing.hero.titleHighlight")}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t("landing.hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                className="flex-0"
                onClick={() => navigate("/auth")}
              >
                {t("landing.hero.startTrial")}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 self-center">
                {t("landing.hero.pricing")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
              <img
                src="https://images.unsplash.com/photo-1767449441925-737379bc2c4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwaGVhbHRoJTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDF8fHx8MTc3MDU3NzU0Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Pilliox App Screenshot"
                className="w-full h-auto"
              />
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#9810FA]/10 to-transparent pointer-events-none"></div>
            </div>
            {/* Floating badge with animation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -bottom-4 -left-4 bg-white dark:bg-black/90 rounded-lg shadow-lg px-4 py-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("landing.hero.trustedBadge")}
                </span>
              </div>
            </motion.div>

            {/* Floating success animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -top-8 -right-8 w-24 h-24"
            >
              {successAnimation.animationData && (
                <Lottie
                  animationData={successAnimation.animationData}
                  loop={true}
                />
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t("landing.features.description")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full flex flex-col gap-2 border-gray-200 dark:border-gray-800 hover:border-[#9810FA] dark:hover:border-[#9810FA] transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-[#9810FA]/10 dark:bg-[#9810FA]/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[#9810FA]" />
                  </div>
                  <h3 className="m-0">{feature.title}</h3>
                  <p className="m-0 text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Security animation in background */}
        <div className="absolute top-1/2 right-0 w-64 h-64 opacity-20 pointer-events-none -translate-y-1/2">
          {securityAnimation.animationData && (
            <Lottie
              animationData={securityAnimation.animationData}
              loop={true}
            />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t("landing.pricing.description")}
          </p>

          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 relative overflow-hidden">
                {/* Subtle pulse animation on hover */}
                <motion.div
                  className="absolute inset-0 bg-[#9810FA]/5 rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="text-center flex gap-4 flex-col gap-4 relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("landing.pricing.plan")}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-blue-500">
                      {t("landing.pricing.price")}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("landing.pricing.perMonth")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("landing.pricing.trialIncluded")}
                  </p>
                </div>

                <ul className="space-y-4 relative z-10">
                  {[
                    t("landing.pricing.features.tracking"),
                    t("landing.pricing.features.pillCounter"),
                    t("landing.pricing.features.colorCoded"),
                    t("landing.pricing.features.tags"),
                    t("landing.pricing.features.backup"),
                    t("landing.pricing.features.multiLanguage"),
                    t("landing.pricing.features.support"),
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <Check className="w-5 h-5 text-[#9810FA] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <div className="relative z-10">
                  <Button onClick={() => navigate("/auth")}>
                    {t("landing.pricing.cta")}
                  </Button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    {t("landing.pricing.cancelAnytime")}
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-border border-1 rounded-2xl p-12 text-center relative overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#9810FA]/10 via-transparent to-[#9810FA]/10"
            animate={{
              backgroundPosition: [
                "0% 50%",
                "100% 50%",
                "0% 50%",
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.cta.title")}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              {t("landing.cta.description")}
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                onClick={() => navigate("/auth")}
              >
                {t("landing.cta.button")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("landing.footer.copyright")}
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => navigate("/docs/privacy")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#9810FA] dark:hover:text-[#9810FA] transition-colors"
              >
                {t("landing.footer.privacy")}
              </button>
              <button
                onClick={() => navigate("/docs/terms")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#9810FA] dark:hover:text-[#9810FA] transition-colors"
              >
                {t("landing.footer.terms")}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}