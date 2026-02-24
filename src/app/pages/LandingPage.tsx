import React, { useEffect, useState } from "react";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { motion, useInView } from "motion/react";
import { Card } from "../components/ui/card";
import {
  Sun,
  Moon,
  Calendar,
  Pill,
  Palette,
  Shield,
  Globe,
  Check,
  Heart,
  Activity,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { LanguageSelector } from "../components/LanguageSelector";
import { Logo } from "../components/Logo";
import { supabase } from "/utils/supabase/client";

// Animated Counter Component
function AnimatedCounter({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(
        (timestamp - startTime) / (duration * 1000),
        1,
      );

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme("system");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const stats = [
    { value: 10000, suffix: "+", label: "Active Users" },
    { value: 50000, suffix: "+", label: "Medications Tracked" },
    { value: 15, suffix: "+", label: "Countries" },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Patient",
      content:
        "Pilliox has completely transformed how I manage my INR values. The color-coded calendar makes it so easy to track patterns.",
      rating: 5,
    },
    {
      name: "Michael K.",
      role: "Warfarin User",
      content:
        "Finally, an app that understands anticoagulation therapy! The pill counter and reminders are lifesavers.",
      rating: 5,
    },
    {
      name: "Anna L.",
      role: "Healthcare Worker",
      content:
        "I recommend this to all my patients. Clean interface, reliable, and actually helps with medication adherence.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white/80 dark:bg-gray-950/80 ">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const isDark =
                  theme === "dark" ||
                  (theme === "system" &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches);
                setTheme(isDark ? "light" : "dark");
              }}
              className="text-gray-600 dark:text-gray-300"
            >
              {theme === "dark" ||
              (theme === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
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
                  className="flex-0 hidden sm:flex"
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
          </div>
        </div>
      </header>

      {/* Hero Section with Floating Elements */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
        {/* Floating decorative elements */}
        <motion.div
          className="absolute top-20 left-10 text-blue-400 opacity-20"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Pill className="w-16 h-16" />
        </motion.div>

        <motion.div
          className="absolute top-40 right-20 text-pink-400 opacity-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Heart className="w-12 h-12" />
        </motion.div>

        <motion.div
          className="absolute bottom-20 left-1/4 text-purple-400 opacity-20"
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Activity className="w-14 h-14" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4"
            >
              <span className="px-4 py-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                ✨ {t("landing.hero.trustedBadge")}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {t("landing.hero.title")}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
              <img
                src="https://images.unsplash.com/photo-1685660375327-47bcca398780?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2F0aW9uJTIwdHJhY2tlciUyMGFwcCUyMGludGVyZmFjZSUyMG1vYmlsZSUyMHBob25lfGVufDF8fHx8MTc3MDYzOTkyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Pilliox App Screenshot"
                className="w-full h-auto"
              />
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none"></div>
            </div>

            {/* Floating stats badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl px-4 py-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Adherence Rate
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    98%
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl px-4 py-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
                  5.0 Rating
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Pilliox Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 sm:p-12 shadow-2xl"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8">
            {t("landing.whyChoose.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">
                {t("landing.whyChoose.easyTracking.title")}
              </h3>
              <p className="text-white/90 text-sm">
                {t("landing.whyChoose.easyTracking.description")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">
                {t("landing.whyChoose.privacyFirst.title")}
              </h3>
              <p className="text-white/90 text-sm">
                {t("landing.whyChoose.privacyFirst.description")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">
                {t("landing.whyChoose.builtForYou.title")}
              </h3>
              <p className="text-white/90 text-sm">
                {t("landing.whyChoose.builtForYou.description")}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 h-full flex flex-col gap-4 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="m-0 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="m-0 text-gray-500 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-transparent">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            What Our Users Say
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied users tracking their
            health with Pilliox
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full flex flex-col gap-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ),
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="mt-auto">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              whileHover={{ scale: 1.02 }}
            >
              <Card className="p-8 relative overflow-hidden border-2 border-blue-500">
                {/* Popular badge */}
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                  Popular
                </div>

                <div className="text-center flex gap-4 flex-col gap-4 relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("landing.pricing.plan")}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-blue-600 dark:text-blue-500">
                      {t("landing.pricing.price")}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("landing.pricing.perMonth")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
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
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-12 text-center relative overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 opacity-30"
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
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              {t("landing.cta.title")}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              {t("landing.cta.description")}
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                {t("landing.cta.button")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {" "}
            <LanguageSelector
              variant="ghost"
              className="flex-0"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("landing.footer.copyright")}
            </p>
            {/* Language Selector */}
            <div className="flex gap-6">
              <button
                onClick={() => navigate("/docs/privacy")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
              >
                {t("landing.footer.privacy")}
              </button>
              <button
                onClick={() => navigate("/docs/terms")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
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