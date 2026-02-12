import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { projectId } from "/utils/supabase/info";

export function DebugAuth() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/admin-list-users`,
        {
          method: "GET",
          headers: {
            "X-Admin-Key": "pilliox-admin-2024-secret",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        console.log(`✅ Found ${data.count} users in Supabase Auth`);
      } else {
        setError(data.error || "Failed to list users");
      }
    } catch (err: any) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Supabase Auth Debug</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={fetchUsers} disabled={loading} className="mb-4">
            {loading ? "Loading..." : "Refresh Users"}
          </Button>

          {users.length === 0 && !loading && (
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <p className="font-bold text-lg mb-2">⚠️ NO USERS FOUND IN SUPABASE AUTH!</p>
                <p className="mb-2">This means you need to create a user account first.</p>
                <p className="text-sm">Go to <a href="/admin-password-reset" className="underline font-bold">/admin-password-reset</a> and use the "Create New User" tab.</p>
              </AlertDescription>
            </Alert>
          )}

          {users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                ✅ Found {users.length} user(s) in Supabase Auth
              </h2>
              
              {users.map((user, index) => (
                <Card key={user.id} className="p-4 bg-green-50 dark:bg-green-900/10 border-green-200">
                  <div className="space-y-2">
                    <p className="text-lg font-bold">User #{index + 1}</p>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <p><strong>📧 Email:</strong> <span className="font-mono bg-background px-2 py-1 rounded">{user.email}</span></p>
                      <p><strong>🆔 ID:</strong> <span className="font-mono text-xs bg-background px-2 py-1 rounded">{user.id}</span></p>
                      <p><strong>👤 Name:</strong> {user.user_metadata?.name || 'N/A'}</p>
                      <p><strong>📅 Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                      <p><strong>✅ Email Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                      {user.last_sign_in_at && (
                        <p><strong>🔑 Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleString()}</p>
                      )}
                    </div>
                    
                    <Alert className="mt-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        <p className="font-bold mb-1">💡 To login as this user:</p>
                        <p>1. Go to <a href="/auth" className="underline font-bold">/auth</a></p>
                        <p>2. Enter email: <span className="font-mono bg-background px-1 rounded">{user.email}</span></p>
                        <p>3. Enter the password you set when creating this user</p>
                        <p className="mt-2 text-xs">🔐 If you forgot the password, use <a href="/admin-password-reset" className="underline">/admin-password-reset</a> to reset it</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
