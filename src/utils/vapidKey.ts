/**
 * VAPID public key for Web Push notifications.
 *
 * Generate your key pair once:
 *   npx web-push generate-vapid-keys
 *
 * Then:
 *   1. Paste the Public Key value below.
 *   2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as Supabase Edge Function
 *      environment variables (Dashboard → Edge Functions → Secrets).
 */
export const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';
