import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const app = new Hono();

// Hardcode the Supabase credentials so we don't need environment variables
const SUPABASE_URL = 'https://svlxczytgstimushobmu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bHhjenl0Z3N0aW11c2hvYm11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0MzE4MSwiZXhwIjoyMDg1MDE5MTgxfQ.xGsuWAbGM-sNLqkArm4wm64RS3qEDcQl1-8wuXvc_VE';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bHhjenl0Z3N0aW11c2hvYm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDMxODEsImV4cCI6MjA4NTAxOTE4MX0.gm3hhEvJXkX77Vg2-m5w7w3M6x3eTlqBrfWvlVWfIZk';

// Create a Supabase client for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// KV Store functions (inline, no need for separate file)
const kvSet = async (key: string, value: any): Promise<void> => {
  const { error } = await supabase.from("kv_store_c7e1f966").upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const { data, error } = await supabase.from("kv_store_c7e1f966").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const { error } = await supabase.from("kv_store_c7e1f966").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const { data, error } = await supabase.from("kv_store_c7e1f966").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
};

// Middleware
app.use('*', cors());

// Helper function to get user from token (supports both OAuth and email/password)
async function getUserFromToken(accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  // First, try to validate as Supabase OAuth token using the SERVICE ROLE to verify the JWT
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      // OAuth token validation failed, continue to email/password check
    } else if (data?.user) {
      // IMPORTANT: Check if this email already exists as an email/password account
      // If so, use that account's ID to maintain data continuity
      const email = data.user.email || '';
      const existingUser = await findUserByEmail(email);
      
      if (existingUser) {
        return existingUser;
      }
      
      // Otherwise, use the OAuth user ID
      return {
        id: data.user.id,
        email: email,
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || ''
      };
    }
  } catch (oauthError: any) {
    // OAuth validation exception, continue to email/password check
  }
  
  // If not OAuth, try email/password token (user ID)
  let user = users.get(accessToken);
  if (!user) {
    const userData = await kvGet(`user:${accessToken}`);
    if (userData) {
      user = userData;
      users.set(accessToken, userData);
    }
  }
  
  if (user) {
    return { id: user.id, email: user.email, name: user.name };
  }
  
  return null;
}

// Helper function to find user by email in the email/password accounts
async function findUserByEmail(email: string): Promise<{ id: string; email: string; name: string } | null> {
  // Check in-memory store first
  for (const [id, user] of users.entries()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return { id: user.id, email: user.email, name: user.name };
    }
  }
  
  // Check KV store
  const userKeys = await kvGetByPrefix('user:');
  for (const userData of userKeys) {
    if (userData.email.toLowerCase() === email.toLowerCase()) {
      // Load into memory for future use
      users.set(userData.id, userData);
      return { id: userData.id, email: userData.email, name: userData.name };
    }
  }
  
  return null;
}

// Simple in-memory user store for demo (you can replace with real auth later)
const users = new Map<string, { email: string; password: string; name: string; id: string }>();

// Health check
app.get('/make-server-c7e1f966/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Fresh calendar server is running!'
  });
});

// Simple signup - creates a user and returns a token (user ID)
app.post('/make-server-c7e1f966/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Check if user already exists
    for (const [id, user] of users.entries()) {
      if (user.email === email) {
        return c.json({ error: 'User already exists' }, 400);
      }
    }
    
    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    users.set(userId, { email, password, name: name || '', id: userId });
    
    // Store user in KV for persistence
    try {
      await kvSet(`user:${userId}`, { email, password, name, id: userId });
    } catch (kvError: any) {
      // Continue anyway - user is in memory
    }
    
    return c.json({ 
      user: { id: userId, email, name },
      access_token: userId
    });
  } catch (error: any) {
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Simple login - validates credentials and returns a token (user ID)
app.post('/make-server-c7e1f966/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Check in-memory store first
    for (const [id, user] of users.entries()) {
      if (user.email === email && user.password === password) {
        return c.json({ 
          user: { id, email, name: user.name },
          access_token: id
        });
      }
    }
    
    // Check KV store
    const userKeys = await kvGetByPrefix('user:');
    for (const userData of userKeys) {
      if (userData.email === email && userData.password === password) {
        // Load into memory
        users.set(userData.id, userData);
        return c.json({ 
          user: { id: userData.id, email, name: userData.name },
          access_token: userData.id
        });
      }
    }
    
    return c.json({ error: 'Invalid email or password' }, 401);
  } catch (error) {
    console.error(`❌ Login error: ${error}`);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Verify token (for debugging)
app.get('/make-server-c7e1f966/verify', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }
    
    // Check if user exists
    let user = users.get(accessToken);
    
    if (!user) {
      // Try loading from KV
      const userData = await kvGet(`user:${accessToken}`);
      if (userData) {
        user = userData;
        users.set(accessToken, userData);
      }
    }
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    return c.json({ 
      user: { id: user.id, email: user.email, name: user.name },
      valid: true
    });
  } catch (error) {
    console.error(`❌ Verify error: ${error}`);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Get calendar entries for a specific month
app.get('/make-server-c7e1f966/calendar/:month', async (c) => {
  try {
    // IMPORTANT: Prioritize X-User-Token over Authorization header
    // (Authorization header might contain anon key from frontend)
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const month = c.req.param('month');
    const key = `calendar:${user.id}:${month}`;
    const entries = await kvGet(key);
    
    return c.json({ entries: entries || {} });
  } catch (error) {
    console.error(`❌ Get calendar entries error: ${error}`);
    return c.json({ error: 'Failed to get calendar entries' }, 500);
  }
});

// Save calendar entries for a specific month
app.post('/make-server-c7e1f966/calendar/:month', async (c) => {
  try {
    // IMPORTANT: Prioritize X-User-Token over Authorization header
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const month = c.req.param('month');
    const { entries } = await c.req.json();
    const key = `calendar:${user.id}:${month}`;
    
    await kvSet(key, entries);
    
    return c.json({ success: true });
  } catch (error) {
    console.error(`❌ Save calendar entries error: ${error}`);
    return c.json({ error: 'Failed to save calendar entries' }, 500);
  }
});

// Clear all data for a user
app.delete('/make-server-c7e1f966/user/data', async (c) => {
  try {
    // Get user token from custom header instead of Authorization
    const accessToken = c.req.header('X-User-Token');
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user exists
    let user = users.get(accessToken);
    if (!user) {
      const userData = await kvGet(`user:${accessToken}`);
      if (userData) {
        user = userData;
        users.set(accessToken, userData);
      }
    }
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Delete all calendar entries
    const calendarKeys = await kvGetByPrefix(`calendar:${user.id}:`);
    for (const entry of calendarKeys) {
      const month = entry.month || 'unknown';
      await kvDel(`calendar:${user.id}:${month}`);
    }
    
    return c.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    console.error(`❌ Clear data error: ${error}`);
    return c.json({ error: 'Failed to clear data' }, 500);
  }
});

// Get user settings
app.get('/make-server-c7e1f966/settings', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Get user settings from KV store
    const settings = await kvGet(`settings:${user.id}`) || {
      weekStartsOnMonday: true,
      theme: 'system'
    };
    
    return c.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      settings 
    });
  } catch (error) {
    console.error(`❌ Get settings error: ${error}`);
    return c.json({ error: 'Failed to get settings' }, 500);
  }
});

// Update user profile
app.post('/make-server-c7e1f966/profile', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const { name } = await c.req.json();
    
    // Update user data in KV store
    const userData = await kvGet(`user:${user.id}`);
    if (userData) {
      userData.name = name;
      await kvSet(`user:${user.id}`, userData);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error(`❌ Update profile error: ${error}`);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Update user settings
app.post('/make-server-c7e1f966/settings', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const { weekStartsOnMonday, theme } = await c.req.json();
    
    // Update settings
    const settings = {
      weekStartsOnMonday: weekStartsOnMonday ?? true,
      theme: theme || 'system'
    };
    
    await kvSet(`settings:${user.id}`, settings);
    
    return c.json({ success: true });
  } catch (error) {
    console.error(`❌ Update settings error: ${error}`);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Change password
app.post('/make-server-c7e1f966/change-password', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const { newPassword } = await c.req.json();
    
    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    // Update password in KV store (only for email/password accounts)
    const userData = await kvGet(`user:${user.id}`);
    if (userData) {
      userData.password = newPassword;
      await kvSet(`user:${user.id}`, userData);
      return c.json({ success: true });
    } else {
      return c.json({ error: 'Cannot change password for OAuth accounts' }, 400);
    }
  } catch (error) {
    console.error(`❌ Change password error: ${error}`);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// Delete account
app.delete('/make-server-c7e1f966/account', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Delete all user data
    await kvDel(`user:${user.id}`);
    await kvDel(`settings:${user.id}`);
    
    // Delete all calendar entries
    const allKeys = await kvGetByPrefix(`calendar:${user.id}:`);
    for (const key of allKeys) {
      await kvDel(`calendar:${user.id}:${key}`);
    }
    
    // Remove from memory
    users.delete(user.id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error(`❌ Delete account error: ${error}`);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

Deno.serve(app.fetch);