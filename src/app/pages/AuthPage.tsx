import { useNavigate } from "react-router";
import { AuthForm } from "../components/AuthForm";

interface AuthPageProps {
  onAuthSuccess: (token: string, email: string) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const navigate = useNavigate();

  const handleAuthSuccess = (token: string, email: string) => {
    // Don't navigate here - let App.tsx handle the navigation
    // based on onboarding status
    onAuthSuccess(token, email);
  };

  return (
    <AuthForm
      onAuthSuccess={handleAuthSuccess}
      onNavigateToTerms={() => navigate("/docs/terms")}
      onNavigateToPrivacy={() => navigate("/docs/privacy")}
    />
  );
}