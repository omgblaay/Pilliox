import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export function AdminPasswordReset() {
  const [email, setEmail] = useState("krystianblaszczyk05@gmail.com");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("Krystian");
  const [adminKey, setAdminKey] = useState("pilliox-admin-2024-secret");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signup" | "reset">("signup");
  const [users, setUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);

  const handleListUsers = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('🔧 [Admin List] Fetching all users...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/admin-list-users`,
        {
          method: "GET",
          headers: {
            "X-Admin-Key": adminKey,
          },
        }
      );

      const data = await response.json();
      console.log('🔧 [Admin List] Response:', data);

      if (response.ok) {
        setUsers(data.users || []);
        setShowUsers(true);
        console.log(`✅ [Admin List] Found ${data.count} users`);
      } else {
        setError(data.error || "Failed to list users");
        console.error('❌ [Admin List] Failed:', data.error);
      }
    } catch (err: any) {
      setError("Network error: " + err.message);
      console.error("❌ [Admin List] Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      console.log('🔧 [Admin Signup] Creating new user:', email);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            password: newPassword,
            name,
          }),
        }
      );

      const data = await response.json();
      console.log('🔧 [Admin Signup] Response:', data);

      if (response.ok) {
        setMessage(`User created successfully! You can now login with this email and password.`);
        console.log('✅ [Admin Signup] User created!');
        console.log('💡 Login credentials:');
        console.log('   Email:', email);
        console.log('   Password: [the password you just set]');
      } else {
        setError(data.error || "Failed to create user");
        console.error('❌ [Admin Signup] Failed:', data.error);
      }
    } catch (err: any) {
      setError("Network error: " + err.message);
      console.error("❌ [Admin Signup] Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      console.log('🔧 [Admin Reset] Starting password reset for:', email);
      console.log('🔧 [Admin Reset] Using admin key:', adminKey.substring(0, 10) + '...');
      console.log('🔧 [Admin Reset] New password length:', newPassword.length);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/admin-update-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Key": adminKey,
          },
          body: JSON.stringify({
            email,
            newPassword,
          }),
        }
      );

      const data = await response.json();
      console.log('🔧 [Admin Reset] Response status:', response.status);
      console.log('🔧 [Admin Reset] Response data:', data);

      if (response.ok) {
        setMessage(data.message || "Password updated successfully!");
        console.log('✅ [Admin Reset] Password reset successful!');
        console.log('💡 You can now login with:');
        console.log('   Email:', email);
        console.log('   Password: [the password you just set]');
        setNewPassword("");
      } else {
        setError(data.error || "Failed to update password");
        console.error('❌ [Admin Reset] Failed:', data.error);
      }
    } catch (err: any) {
      setError("Network error: " + err.message);
      console.error("❌ [Admin Reset] Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "signup") {
      handleSignup();
    } else {
      handleReset();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Password Reset</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Reset any user's password with admin privileges
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-200">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {showUsers && users.length > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <p className="font-semibold">Found {users.length} user(s) in Supabase Auth:</p>
                {users.map((user) => (
                  <div key={user.id} className="text-xs p-2 bg-background rounded border">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Name:</strong> {user.user_metadata?.name || 'N/A'}</p>
                    <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showUsers && users.length === 0 && (
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <p><strong>No users found in Supabase Auth!</strong></p>
              <p className="text-xs mt-1">This means you need to create a user first using the "Create New User" tab.</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Create New User
            </button>
            <button
              onClick={() => setMode("reset")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "reset"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Reset Password
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">{mode === "signup" ? "Password" : "New Password"}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={mode === "signup" ? "Enter password (min 6 chars)" : "Enter new password (min 6 chars)"}
              minLength={6}
            />
          </div>

          {mode === "reset" && (
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin secret key"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !email || !newPassword || newPassword.length < 6}
            className="w-full"
          >
            {loading 
              ? (mode === "signup" ? "Creating..." : "Resetting...") 
              : (mode === "signup" ? "Create User" : "Reset Password")}
          </Button>

          {mode === "reset" && (
            <Button
              onClick={handleListUsers}
              disabled={loading || !adminKey}
              className="w-full mt-2"
            >
              {loading ? "Listing users..." : "List Users"}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          {mode === "signup" ? (
            <>
              <p>👤 Creates a new user account</p>
              <p>📧 Email confirmation is bypassed</p>
              <p>✅ User can login immediately</p>
            </>
          ) : (
            <>
              <p>⚠️ This is an admin-only tool</p>
              <p>🔐 Requires the admin secret key</p>
              <p>🔄 Updates password for existing user</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}