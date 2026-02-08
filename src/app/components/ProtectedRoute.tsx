import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  children: ReactNode;
}

export function ProtectedRoute({ isAuthenticated, isLoading, children }: ProtectedRouteProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-blue-400"></div>
          <p className="mt-4 text-white font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
