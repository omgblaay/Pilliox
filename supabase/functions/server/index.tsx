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
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  credentials: false,
}));

// Helper function to retry failed requests with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 200
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is a connection reset or network error
      const isNetworkError = 
        error?.message?.includes('connection reset') ||
        error?.message?.includes('connection error') ||
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('client error');
      
      // If it's the last attempt or not a network error, throw immediately
      if (attempt === maxRetries - 1 || !isNetworkError) {
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Helper function to get user from token (supports both OAuth and email/password)
async function getUserFromToken(accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  // First, try to validate as Supabase OAuth token using the SERVICE ROLE to verify the JWT
  try {
    // Wrap the auth call with retry logic for connection errors
    const { data, error } = await retryWithBackoff(
      () => supabase.auth.getUser(accessToken),
      3, // Reduced to 3 retries for faster failure
      100 // Start with 100ms delay
    );
    
    if (error) {
      console.log('OAuth token validation failed:', error.message);
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
    // OAuth validation exception - log but don't fail completely
    // This can happen during transient network issues
    console.log('OAuth validation exception (will try email/password):', oauthError.message);
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

// ====== STRIPE WEBHOOK - MUST BE FIRST (before any middleware) ======
// This endpoint needs to be public and accept requests from Stripe without authentication
app.post('/make-server-c7e1f966/subscription/webhook', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError: any) {
      return c.json({ error: 'Invalid JSON' }, 400);
    }
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('=== HANDLING CHECKOUT.SESSION.COMPLETED ===');
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        console.log('Checkout data:', {
          userId,
          customer: session.customer,
          subscription: session.subscription
        });
        
        if (userId) {
          try {
            // Fetch the subscription details from Stripe immediately
            const subscriptionId = session.subscription;
            
            if (subscriptionId && STRIPE_SECRET_KEY) {
              console.log('Fetching subscription details from Stripe:', subscriptionId);
              const subResponse = await fetch(
                `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                  },
                }
              );
              
              if (subResponse.ok) {
                const subscription = await subResponse.json();
                console.log('Fetched subscription:', {
                  id: subscription.id,
                  status: subscription.status,
                  currentPeriodEnd: subscription.current_period_end,
                });
                
                // Save complete subscription data
                const subData = await kvGet(`subscription:${userId}`) || {};
                subData.stripeCustomerId = session.customer;
                subData.stripeSubscriptionId = subscriptionId;
                subData.status = subscription.status;
                subData.currentPeriodEnd = subscription.current_period_end * 1000;
                subData.cancelAtPeriodEnd = subscription.cancel_at_period_end;
                await kvSet(`subscription:${userId}`, subData);
                console.log(`✅ Checkout completed with full subscription data for user ${userId}`);
              } else {
                console.log('Failed to fetch subscription details, saving basic data');
                const subData = await kvGet(`subscription:${userId}`) || {};
                subData.stripeCustomerId = session.customer;
                subData.stripeSubscriptionId = subscriptionId;
                await kvSet(`subscription:${userId}`, subData);
              }
            } else {
              // Fallback: save basic data
              const subData = await kvGet(`subscription:${userId}`) || {};
              subData.stripeCustomerId = session.customer;
              subData.stripeSubscriptionId = session.subscription;
              await kvSet(`subscription:${userId}`, subData);
              console.log(`✅ Checkout completed for user ${userId} (basic data)`);
            }
          } catch (kvError: any) {
            console.log('ERROR: Failed to save checkout data:', kvError.message);
          }
        } else {
          console.log('WARNING: No userId in checkout session metadata');
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log('=== HANDLING SUBSCRIPTION EVENT ===');
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log('Subscription data:', {
          type: event.type,
          customer: customerId,
          status: subscription.status,
          subscriptionId: subscription.id
        });
        
        try {
          // Find user by customer ID - search through all subscription keys
          const { data: allKeys, error: selectError } = await supabase
            .from('kv_store_c7e1f966')
            .select('key, value')
            .like('key', 'subscription:%');
          
          if (selectError) {
            console.log('ERROR: Failed to query subscriptions:', selectError.message);
            break;
          }
          
          console.log(`Found ${allKeys?.length || 0} subscription records`);
          
          if (allKeys) {
            let userFound = false;
            for (const row of allKeys) {
              const subData = row.value;
              console.log('Checking subscription record:', {
                key: row.key,
                stripeCustomerId: subData.stripeCustomerId
              });
              
              if (subData.stripeCustomerId === customerId) {
                const userId = row.key.replace('subscription:', '');
                console.log(`Found matching user: ${userId}`);
                
                // Update subscription data
                subData.status = subscription.status;
                subData.currentPeriodEnd = subscription.current_period_end * 1000;
                subData.cancelAtPeriodEnd = subscription.cancel_at_period_end;
                subData.stripeSubscriptionId = subscription.id;
                
                await kvSet(`subscription:${userId}`, subData);
                console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
                userFound = true;
                break;
              }
            }
            
            if (!userFound) {
              console.log('WARNING: No user found for customer:', customerId);
            }
          }
        } catch (dbError: any) {
          console.log('ERROR: Database error in subscription update:', dbError.message);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log('=== HANDLING SUBSCRIPTION DELETED ===');
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log('Subscription deleted - customer:', customerId);
        
        try {
          // Find user by customer ID and mark subscription as cancelled
          const { data: allKeys, error: selectError } = await supabase
            .from('kv_store_c7e1f966')
            .select('key, value')
            .like('key', 'subscription:%');
          
          if (selectError) {
            console.log('ERROR: Failed to query subscriptions:', selectError.message);
            break;
          }
          
          if (allKeys) {
            for (const row of allKeys) {
              const subData = row.value;
              if (subData.stripeCustomerId === customerId) {
                const userId = row.key.replace('subscription:', '');
                
                subData.status = 'cancelled';
                subData.currentPeriodEnd = null;
                
                await kvSet(`subscription:${userId}`, subData);
                console.log(`✅ Subscription cancelled for user ${userId}`);
                break;
              }
            }
          }
        } catch (dbError: any) {
          console.log('ERROR: Database error in subscription deletion:', dbError.message);
        }
        break;
      }
      
      default:
        console.log('Unhandled webhook event type:', event.type);
    }
    
    console.log('=== WEBHOOK COMPLETED SUCCESSFULLY ===');
    return c.json({ received: true });
  } catch (error: any) {
    console.log('=== WEBHOOK ERROR ===');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    return c.json({ error: 'Webhook failed', details: error.message }, 400);
  }
});

// Health check
app.get('/make-server-c7e1f966/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.4.3',
    message: 'Fresh calendar server is running with enhanced logging!',
    env: {
      hasStripeSecretKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
      hasStripePublishableKey: !!Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      hasStripeWebhookSecret: !!Deno.env.get('STRIPE_WEBHOOK_SECRET'),
      stripeSecretKeyPrefix: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10),
    }
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
    return c.json({ error: 'Failed to save calendar entries' }, 500);
  }
});

// Clear all data for a user
app.delete('/make-server-c7e1f966/user/data', async (c) => {
  try {
    // Get user token from custom header instead of Authorization
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('Clear data error: No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user using the helper function
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      console.log('Clear data error: Invalid user token');
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    console.log(`Clearing all calendar data for user: ${user.id}`);
    
    // Delete all calendar entries - query keys directly from database
    const { data: calendarKeys, error } = await supabase
      .from("kv_store_c7e1f966")
      .select("key")
      .like("key", `calendar:${user.id}:%`);
    
    if (error) {
      console.error('Error querying calendar keys:', error);
      return c.json({ error: 'Failed to query calendar data' }, 500);
    }
    
    console.log(`Found ${calendarKeys?.length || 0} calendar entries to delete`);
    
    if (calendarKeys && calendarKeys.length > 0) {
      for (const row of calendarKeys) {
        console.log(`Deleting calendar key: ${row.key}`);
        await kvDel(row.key);
      }
    }
    
    console.log('Calendar data cleared successfully');
    return c.json({ success: true, message: 'All calendar data cleared', deleted: calendarKeys?.length || 0 });
  } catch (error) {
    console.error('Error clearing calendar data:', error);
    return c.json({ error: 'Failed to clear data', details: String(error) }, 500);
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
      theme: 'system',
      viewMode: 'month'
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
    
    const { weekStartsOnMonday, theme, viewMode } = await c.req.json();
    
    // Update settings
    const settings = {
      weekStartsOnMonday: weekStartsOnMonday ?? true,
      theme: theme || 'system',
      viewMode: viewMode || 'month'
    };
    
    await kvSet(`settings:${user.id}`, settings);
    
    return c.json({ success: true });
  } catch (error) {
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
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Clear subscription data (for testing/switching from test to live Stripe)
app.post('/make-server-c7e1f966/subscription/reset', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    console.log(`[subscription/reset] Clearing subscription data for user: ${user.id}`);
    
    // Get current subscription data to log what we're clearing
    const currentData = await kvGet(`subscription:${user.id}`);
    console.log(`[subscription/reset] Current data:`, {
      hasCustomerId: !!currentData?.stripeCustomerId,
      customerId: currentData?.stripeCustomerId,
      hasSubscriptionId: !!currentData?.stripeSubscriptionId,
    });
    
    // Delete subscription data completely - this will force creation of new customer
    await kvDel(`subscription:${user.id}`);
    
    console.log(`[subscription/reset] ✅ Subscription data cleared for user: ${user.id}`);
    
    return c.json({ 
      success: true, 
      message: 'Subscription data cleared. New customer will be created on next checkout.',
      clearedCustomerId: currentData?.stripeCustomerId,
    });
  } catch (error: any) {
    console.error('[subscription/reset] Error:', error.message);
    return c.json({ error: 'Failed to reset subscription' }, 500);
  }
});

// ====== SUBSCRIPTION ROUTES ======

// Get subscription status
app.get('/make-server-c7e1f966/subscription/status', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[subscription/status] Request received, token present:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    console.log('[subscription/status] User found:', !!user, user?.email);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Get subscription data from KV store
    const subData = await kvGet(`subscription:${user.id}`) || {};
    
    console.log('[subscription/status] Subscription data from KV:', {
      hasData: Object.keys(subData).length > 0,
      status: subData.status,
      hasCustomerId: !!subData.stripeCustomerId,
      hasSubscriptionId: !!subData.stripeSubscriptionId,
      currentPeriodEnd: subData.currentPeriodEnd,
      signupDate: subData.signupDate,
      trialEnd: subData.trialEnd
    });
    
    const now = Date.now();
    const trialEnd = subData.trialEnd || (subData.signupDate ? subData.signupDate + (3 * 24 * 60 * 60 * 1000) : now + (3 * 24 * 60 * 60 * 1000));
    
    // Check if trial is active
    const isTrialActive = now < trialEnd;
    
    // Check if subscription is active
    const isSubscriptionActive = subData.status === 'active' && subData.currentPeriodEnd && now < subData.currentPeriodEnd;
    
    console.log('[subscription/status] Calculated values:', {
      now: new Date(now).toISOString(),
      trialEnd: new Date(trialEnd).toISOString(),
      isTrialActive,
      isSubscriptionActive,
      hasAccess: isTrialActive || isSubscriptionActive
    });
    
    // If first time, set signup date
    if (!subData.signupDate) {
      subData.signupDate = now;
      subData.trialEnd = trialEnd;
      await kvSet(`subscription:${user.id}`, subData);
      console.log('[subscription/status] First time user - set signup date and trial end');
    }
    
    const response = {
      hasAccess: isTrialActive || isSubscriptionActive,
      isTrialActive,
      trialEndsAt: trialEnd,
      trialDaysLeft: Math.max(0, Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000))),
      subscription: {
        status: subData.status || 'none',
        currentPeriodEnd: subData.currentPeriodEnd,
        cancelAtPeriodEnd: subData.cancelAtPeriodEnd || false,
        stripeCustomerId: subData.stripeCustomerId,
        stripeSubscriptionId: subData.stripeSubscriptionId,
      }
    };
    
    console.log('[subscription/status] Returning response:', response);
    
    return c.json(response);
  } catch (error: any) {
    console.log('Error getting subscription status:', error.message);
    return c.json({ error: 'Failed to get subscription status' }, 500);
  }
});

// Create Stripe checkout session
app.post('/make-server-c7e1f966/subscription/create-checkout', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];;
    
    console.log('Create checkout - accessToken present:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    console.log('Create checkout - user found:', !!user);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log('Create checkout - Stripe key present:', !!STRIPE_SECRET_KEY);
    console.log('Create checkout - Stripe key prefix:', STRIPE_SECRET_KEY?.substring(0, 7));
    console.log('Create checkout - Stripe key type:', STRIPE_SECRET_KEY?.includes('_test_') ? 'TEST' : STRIPE_SECRET_KEY?.includes('_live_') ? 'LIVE' : 'UNKNOWN');
    
    if (!STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    // Get subscription data
    let subData = await kvGet(`subscription:${user.id}`) || {};
    
    console.log('Create checkout - existing subscription:', {
      hasCustomerId: !!subData.stripeCustomerId,
      hasSubscriptionId: !!subData.stripeSubscriptionId,
      status: subData.status
    });
    
    // Check if user already has an active subscription
    if (subData.stripeSubscriptionId) {
      console.log('Checking existing subscription status...');
      
      // Fetch current subscription from Stripe
      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subData.stripeSubscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          },
        }
      );
      
      if (stripeResponse.ok) {
        const subscription = await stripeResponse.json();
        console.log('Existing subscription status:', subscription.status);
        
        // If subscription is active or trialing, don't create a new one
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          return c.json({ 
            error: 'You already have an active subscription',
            existingSubscription: true,
            status: subscription.status
          }, 400);
        }
      }
    }
    
    // Get or create Stripe customer
    let customerId = subData.stripeCustomerId;
    
    console.log('Create checkout - existing customerId:', customerId);
    
    if (!customerId) {
      // Create Stripe customer
      console.log('Creating new Stripe customer for:', user.email);
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email,
          'metadata[userId]': user.id
        })
      });
      
      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.log('Error creating Stripe customer:', errorData);
        return c.json({ error: 'Failed to create customer', details: errorData }, 500);
      }
      
      const customer = await customerResponse.json();
      customerId = customer.id;
      
      console.log('Created Stripe customer:', customerId);
      
      subData.stripeCustomerId = customerId;
      await kvSet(`subscription:${user.id}`, subData);
    } else {
      // Verify existing customer is valid in current mode (test vs live)
      console.log('Verifying existing customer in current Stripe mode...');
      const verifyResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        
        // Check if customer exists in wrong mode (test customer with live key or vice versa)
        if (errorData.error?.code === 'resource_missing' && 
            errorData.error?.message?.includes('similar object exists in')) {
          console.log('Customer exists in wrong mode (test vs live). Creating new customer...');
          
          // Clear old customer ID and create new one
          subData.stripeCustomerId = null;
          subData.stripeSubscriptionId = null;
          
          // Create new customer in current mode
          const newCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: user.email,
              'metadata[userId]': user.id
            })
          });
          
          if (!newCustomerResponse.ok) {
            const newErrorData = await newCustomerResponse.text();
            console.log('Error creating new customer:', newErrorData);
            return c.json({ error: 'Failed to create customer', details: newErrorData }, 500);
          }
          
          const newCustomer = await newCustomerResponse.json();
          customerId = newCustomer.id;
          
          console.log('Created new customer in correct mode:', customerId);
          
          subData.stripeCustomerId = customerId;
          await kvSet(`subscription:${user.id}`, subData);
        } else {
          // Other error - return it
          console.log('Error verifying customer:', JSON.stringify(errorData));
          return c.json({ error: 'Invalid customer', details: JSON.stringify(errorData) }, 400);
        }
      } else {
        console.log('Existing customer is valid in current mode');
      }
    }
    
    // Create checkout session
    const { returnUrl } = await c.req.json();
    
    console.log('Creating checkout session with returnUrl:', returnUrl);
    
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': 'Pilliox Premium',
        'line_items[0][price_data][product_data][description]': 'Monthly subscription for INR tracking',
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][unit_amount]': '299', // €2.99 in cents
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: `${returnUrl || 'https://pilliox.com'}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: returnUrl || 'https://pilliox.com',
        'metadata[userId]': user.id,
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.log('Error creating checkout session:', errorData);
      return c.json({ error: 'Failed to create checkout session', details: errorData }, 500);
    }
    
    const session = await checkoutResponse.json();
    
    return c.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.log('Error creating checkout session:', error.message);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// Create customer portal session
app.post('/make-server-c7e1f966/subscription/create-portal', async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    const subData = await kvGet(`subscription:${user.id}`);
    
    if (!subData || !subData.stripeCustomerId) {
      return c.json({ error: 'No subscription found' }, 404);
    }
    
    const { returnUrl } = await c.req.json();
    
    // Create portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: subData.stripeCustomerId,
        return_url: returnUrl || 'https://pilliox.com',
      })
    });
    
    if (!portalResponse.ok) {
      const errorData = await portalResponse.text();
      console.log('Error creating portal session:', errorData);
      return c.json({ error: 'Failed to create portal session' }, 500);
    }
    
    const portal = await portalResponse.json();
    
    return c.json({ url: portal.url });
  } catch (error: any) {
    console.log('Error creating portal session:', error.message);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

// Manually sync subscription status from Stripe
app.post('/make-server-c7e1f966/subscription/sync', async (c) => {
  console.log('[SYNC BACKEND] === Sync endpoint called ===');
  
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[SYNC BACKEND] Headers:', {
      hasXUserToken: !!c.req.header('X-User-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      accessTokenLength: accessToken?.length
    });
    
    if (!accessToken) {
      console.log('[SYNC BACKEND] ERROR: No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    console.log('[SYNC BACKEND] User from token:', user ? `${user.id} (${user.email})` : 'null');
    
    if (!user) {
      console.log('[SYNC BACKEND] ERROR: Invalid token');
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      console.log('[SYNC BACKEND] ERROR: Stripe not configured');
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    const subData = await kvGet(`subscription:${user.id}`);
    
    console.log('[SYNC BACKEND] Subscription data:', {
      hasSubData: !!subData,
      stripeSubscriptionId: subData?.stripeSubscriptionId
    });
    
    if (!subData || !subData.stripeSubscriptionId) {
      console.log('[SYNC BACKEND] No subscription to sync - clearing status');
      // Clear any stale subscription data
      if (subData) {
        subData.status = 'none';
        subData.currentPeriodEnd = null;
        subData.cancelAtPeriodEnd = false;
        await kvSet(`subscription:${user.id}`, subData);
      }
      return c.json({ success: true, status: 'none', message: 'No active subscription' });
    }
    
    console.log('[SYNC BACKEND] Fetching from Stripe:', subData.stripeSubscriptionId);
    
    // Fetch subscription from Stripe
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subData.stripeSubscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );
    
    console.log('[SYNC BACKEND] Stripe response status:', stripeResponse.status);
    
    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.log('[SYNC BACKEND] ERROR from Stripe:', errorData);
      
      // If subscription not found in Stripe (404), clear local data
      if (stripeResponse.status === 404) {
        console.log('[SYNC BACKEND] Subscription not found in Stripe - clearing local data');
        subData.status = 'cancelled';
        subData.currentPeriodEnd = null;
        subData.cancelAtPeriodEnd = false;
        subData.stripeSubscriptionId = null;
        await kvSet(`subscription:${user.id}`, subData);
        return c.json({ success: true, status: 'cancelled', message: 'Subscription cancelled' });
      }
      
      return c.json({ error: 'Failed to fetch subscription' }, 500);
    }
    
    const subscription = await stripeResponse.json();
    
    console.log('[SYNC BACKEND] Stripe subscription:', {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    });
    
    // Update subscription data
    subData.status = subscription.status;
    subData.currentPeriodEnd = subscription.current_period_end * 1000;
    subData.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    await kvSet(`subscription:${user.id}`, subData);
    
    console.log(`[SYNC BACKEND] ✅ Subscription synced for user ${user.id}: ${subscription.status}`);
    
    return c.json({ success: true, status: subscription.status });
  } catch (error: any) {
    console.log('[SYNC BACKEND] ERROR Exception:', error.message, error.stack);
    return c.json({ error: 'Failed to sync subscription' }, 500);
  }
});

// Complete checkout - fetch session details from Stripe after successful payment
app.post('/make-server-c7e1f966/subscription/complete-checkout', async (c) => {
  console.log('[COMPLETE CHECKOUT] === Complete checkout endpoint called ===');
  
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('[COMPLETE CHECKOUT] ERROR: No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      console.log('[COMPLETE CHECKOUT] ERROR: Invalid token');
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const { sessionId } = await c.req.json();
    
    console.log('[COMPLETE CHECKOUT] Session ID:', sessionId);
    
    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }
    
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      console.log('[COMPLETE CHECKOUT] ERROR: Stripe not configured');
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    // Fetch checkout session from Stripe
    console.log('[COMPLETE CHECKOUT] Fetching session from Stripe...');
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );
    
    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.text();
      console.log('[COMPLETE CHECKOUT] ERROR from Stripe:', errorData);
      return c.json({ error: 'Failed to fetch checkout session' }, 500);
    }
    
    const session = await sessionResponse.json();
    
    console.log('[COMPLETE CHECKOUT] Checkout session:', {
      customer: session.customer,
      subscription: session.subscription,
      status: session.status
    });
    
    // Update subscription data
    const subData = await kvGet(`subscription:${user.id}`) || {};
    subData.stripeCustomerId = session.customer;
    subData.stripeSubscriptionId = session.subscription;
    
    await kvSet(`subscription:${user.id}`, subData);
    
    console.log(`[COMPLETE CHECKOUT] ✅ Subscription IDs saved for user ${user.id}`);
    
    // Now fetch and update subscription status
    if (session.subscription) {
      const subResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${session.subscription}`,
        {
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          },
        }
      );
      
      if (subResponse.ok) {
        const subscription = await subResponse.json();
        subData.status = subscription.status;
        subData.currentPeriodEnd = subscription.current_period_end * 1000;
        subData.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        await kvSet(`subscription:${user.id}`, subData);
        
        console.log(`[COMPLETE CHECKOUT] ✅ Subscription status updated: ${subscription.status}`);
      }
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.log('[COMPLETE CHECKOUT] ERROR Exception:', error.message);
    return c.json({ error: 'Failed to complete checkout' }, 500);
  }
});

// Get pills settings
app.get('/make-server-c7e1f966/pills-settings/:userId', async (c) => {
  try {
    // IMPORTANT: Prioritize X-User-Token over Authorization header
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('[PILLS SETTINGS GET] No token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('[PILLS SETTINGS GET] Validating token...');
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      console.log('[PILLS SETTINGS GET] Invalid token - getUserFromToken returned null');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = c.req.param('userId');
    
    console.log('[PILLS SETTINGS GET] User from token:', user.id);
    console.log('[PILLS SETTINGS GET] UserId from URL:', userId);
    
    // Verify user can only access their own settings
    if (user.id !== userId) {
      console.log('[PILLS SETTINGS GET] User trying to access another user settings');
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const settings = await kvGet(`pills_settings:${userId}`);
    
    console.log('[PILLS SETTINGS GET] Settings loaded:', settings ? 'found' : 'not found');
    
    return c.json({ pills: settings || [] });
  } catch (error) {
    console.log('[PILLS SETTINGS GET] ERROR:', error.message);
    return c.json({ error: 'Failed to get pills settings' }, 500);
  }
});

// Update pills settings
app.put('/make-server-c7e1f966/pills-settings/:userId', async (c) => {
  try {
    // IMPORTANT: Prioritize X-User-Token over Authorization header
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('[PILLS SETTINGS UPDATE] No token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const user = await getUserFromToken(accessToken);
    
    if (!user) {
      console.log('[PILLS SETTINGS UPDATE] Invalid token');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = c.req.param('userId');
    
    // Verify user can only update their own settings
    if (user.id !== userId) {
      console.log('[PILLS SETTINGS UPDATE] User trying to update another user settings');
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const body = await c.req.json();
    const { pills } = body;
    
    if (!Array.isArray(pills)) {
      return c.json({ error: 'Invalid pills data' }, 400);
    }
    
    // Validate pills data
    for (const pill of pills) {
      if (!pill.id || !pill.name || typeof pill.defaultDosage !== 'number') {
        return c.json({ error: 'Invalid pill data format' }, 400);
      }
    }
    
    await kvSet(`pills_settings:${userId}`, pills);
    
    console.log(`[PILLS SETTINGS UPDATE] Saved settings for user ${userId}:`, pills.length, 'medications');
    
    return c.json({ success: true });
  } catch (error) {
    console.log('[PILLS SETTINGS UPDATE] ERROR:', error.message);
    return c.json({ error: 'Failed to update pills settings' }, 500);
  }
});

Deno.serve(app.fetch);