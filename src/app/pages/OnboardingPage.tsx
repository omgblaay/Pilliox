import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Check,
  Calendar,
  Pill,
  Bell,
  Shield,
} from "lucide-react";
import Vector from "../../imports/Vector";

const ONBOARDING_STEPS = [
  {
    icon: Calendar,
    titleKey: "onboarding.step1.title",
    descriptionKey: "onboarding.step1.description",
    defaultTitle: "Track Your Health",
    defaultDescription:
      "Keep track of your INR values, blood tests, and medication schedule all in one place.",
  },
  {
    icon: Pill,
    titleKey: "onboarding.step2.title",
    descriptionKey: "onboarding.step2.description",
    defaultTitle: "Manage Medications",
    defaultDescription:
      "Set up your medications with custom dosages and schedules. Never miss a dose again.",
  },
  {
    icon: Bell,
    titleKey: "onboarding.step3.title",
    descriptionKey: "onboarding.step3.description",
    defaultTitle: "Smart Reminders",
    defaultDescription:
      "Get timely notifications for your medications and health tracking appointments.",
  },
  {
    icon: Shield,
    titleKey: "onboarding.step4.title",
    descriptionKey: "onboarding.step4.description",
    defaultTitle: "Secure & Private",
    defaultDescription:
      "Your health data is encrypted and securely stored. Only you have access to your information.",
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Mark onboarding as completed
    localStorage.setItem(
      "pilliox_onboarding_completed",
      "true",
    );
    navigate("/app");
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep =
    currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="min-h-screen bg-card flex flex-col">
      {/* Header with Logo */}
      <div className="flex justify-between w-full p-4 lg:max-w-[800px] m-auto items-center">
        <div className="h-[32px] w-[128px]">
          <Vector />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="relative w-32 h-32 flex items-center justify-center"
                  >
                    {/* Animated background circle */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full bg-blue-600"
                    />
                    
                    {/* Animated icon */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        rotate: currentStep === 1 ? [0, 5, -5, 0] : 0,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <currentStepData.icon className="w-16 h-16 text-blue-600 dark:text-blue-400 relative z-10" strokeWidth={1.5} />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-center text-foreground"
                >
                  {t(currentStepData.titleKey) ||
                    currentStepData.defaultTitle}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-muted-foreground leading-relaxed"
                >
                  {t(currentStepData.descriptionKey) ||
                    currentStepData.defaultDescription}
                </motion.p>
              </Card>
            </motion.div>
          </AnimatePresence>
          {/* Progress Dots */}
          <div className="flex mt-5 justify-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : index < currentStep
                      ? "w-2 bg-blue-400"
                      : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 w-full backdrop-blur-lg border-t border-border">
        <div className="lg:max-w-[800px] w-full m-auto mx-auto gap-6 flex">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
          >
            {t("onboarding.skip") || "Skip"}
          </Button>

          {/* Next Button */}
          <Button onClick={handleNext} className="flex-1">
            {isLastStep ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                {t("onboarding.getStarted") || "Get Started"}
              </>
            ) : (
              <>
                {t("onboarding.next") || "Next"}
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}