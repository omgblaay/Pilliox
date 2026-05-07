import { useNavigate } from "react-router";
import { AuthForm } from "../components/AuthForm";

interface AuthPageProps {
  onAuthSuccess: (token: string, email: string, refreshToken?: string) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const navigate = useNavigate();

  const handleAuthSuccess = (token: string, email: string, refreshToken?: string) => {
    onAuthSuccess(token, email, refreshToken);
  };

  return (
    <AuthForm
      onAuthSuccess={handleAuthSuccess}
      onNavigateToTerms={() => navigate("/docs/terms")}
      onNavigateToPrivacy={() => navigate("/docs/privacy")}
    />
  );
}