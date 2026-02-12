import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { getSupabaseClient } from "../../../utils/supabase/client";
import { useTranslation } from "react-i18next";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Exchange code for session and verify on mount
  useEffect(() => {
    const setupSession = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Check for error parameters first (e.g., expired link)
        const urlError = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        if (urlError || errorCode) {
          console.error('❌ Password reset error from URL:', {
            error: urlError,
            errorCode,
            errorDescription: decodeURIComponent(errorDescription || '')
          });
          
          setSessionValid(false);
          
          if (errorCode === 'otp_expired') {
            setError(t("auth.resetLinkExpired") || "This password reset link has expired. Please request a new one.");
          } else {
            setError(decodeURIComponent(errorDescription || '') || t("auth.invalidResetLink") || "Invalid or expired reset link. Please request a new one.");
          }
          return;
        }
        
        // Check for hash fragments (legacy token-based flow)
        // This is the most reliable for email links
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('🔍 Checking URL for password reset tokens:', {
          hasHash: !!window.location.hash,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          hashLength: window.location.hash.length
        });
        
        if (accessToken && type === 'recovery') {
          console.log('🔐 Found recovery token in URL hash, setting session...');
          
          // Set the session using the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          console.log('🔄 Session set result:', {
            success: !!data.session,
            error: sessionError,
            userId: data.session?.user?.id,
            userEmail: data.session?.user?.email
          });
          
          if (sessionError) {
            console.error('❌ Failed to set session from recovery token:', sessionError);
            setSessionValid(false);
            setError(t("auth.invalidResetLink") || "Invalid or expired reset link. Please request a new one.");
            return;
          }
          
          if (!data.session) {
            console.error('❌ Setting session did not return a session');
            setSessionValid(false);
            setError(t("auth.invalidResetLink") || "Invalid or expired reset link. Please request a new one.");
            return;
          }
          
          console.log('✅ Successfully set session from recovery token');
          console.log('👤 User ID:', data.session.user.id);
          console.log('📧 User Email:', data.session.user.email);
          
          setSessionValid(true);
          
          // Clean up the URL by removing the hash
          window.history.replaceState(null, '', '/reset-password');
          return;
        }
        
        // Fallback: Check if we already have a valid session
        // (this handles the case where the user refreshes the page)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔍 Reset password page - session check:', { 
          hasSession: !!session, 
          error: sessionError,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        if (sessionError || !session) {
          console.error('❌ No valid session for password reset:', sessionError);
          setSessionValid(false);
          setError(t("auth.invalidResetLink") || "Invalid or expired reset link. Please request a new one.");
        } else {
          console.log('✅ Valid session found');
          console.log('👤 User ID:', session.user.id);
          console.log('📧 User Email:', session.user.email);
          setSessionValid(true);
        }
      } catch (err: any) {
        console.error('❌ Session setup error:', err);
        setSessionValid(false);
        setError(t("auth.sessionVerificationError") || "Could not verify your session. Please try again.");
      }
    };

    setupSession();
  }, [t, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords
    if (newPassword.length < 6) {
      setError(t("auth.passwordMinLength") || "Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDontMatch") || "Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // Double-check session before updating
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Current session before password update:', { 
        session, 
        sessionError,
        hasUser: !!session?.user,
        userId: session?.user?.id
      });
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error(t("auth.sessionExpired") || "Your session has expired. Please request a new reset link.");
      }

      console.log('Attempting to update password for user:', session.user.id);
      
      // Update password using Supabase Auth
      // IMPORTANT: This should work if we have a valid PASSWORD_RECOVERY session
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('Password update response:', { 
        success: !updateError,
        error: updateError,
        userData: data?.user?.id
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      if (!data || !data.user) {
        throw new Error("Password update did not return user data");
      }

      console.log('✅ Password updated successfully for user:', data.user.id);
      setSuccess(true);
      
      // Sign out the user after successful password reset
      // This ensures they need to log in with their new password
      console.log('Signing out user after password reset...');
      await supabase.auth.signOut();
      
      // Clear any stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      
      console.log('User signed out successfully');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err: any) {
      console.error("❌ Password reset error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        name: err.name,
        details: err
      });
      setError(err.message || t("auth.resetPasswordError") || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {t("auth.passwordResetSuccess") || "Password Reset Successful"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t("auth.redirectingToLogin") || "Redirecting to login..."}
          </p>
        </motion.div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {t("auth.passwordResetFailed") || "Password Reset Failed"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("auth.backToLogin") || "Back to Login"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("auth.backToLogin") || "Back to Login"}
            </Button>
            
            <h1 className="text-2xl font-bold mb-2">
              {t("auth.resetPassword") || "Reset Password"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.enterNewPassword") || "Enter your new password below"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                {t("auth.newPassword") || "New Password"}
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder") || "Enter your password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                {t("auth.confirmPassword") || "Confirm Password"}
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.confirmPasswordPlaceholder") || "Confirm your password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? t("auth.resetting") || "Resetting..."
                : t("auth.resetPasswordButton") || "Reset Password"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}