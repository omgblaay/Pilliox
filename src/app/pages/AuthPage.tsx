import { useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";

interface AuthPageProps {
  onAuthSuccess: (token: string, email: string) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const navigate = useNavigate();

  const handleAuthSuccess = (token: string, email: string) => {
    onAuthSuccess(token, email);
    navigate("/app");
  };

  return (
    <AuthForm
      onAuthSuccess={handleAuthSuccess}
      onNavigateToTerms={() => navigate("/docs/terms")}
      onNavigateToPrivacy={() => navigate("/docs/privacy")}
    />
  );
}
