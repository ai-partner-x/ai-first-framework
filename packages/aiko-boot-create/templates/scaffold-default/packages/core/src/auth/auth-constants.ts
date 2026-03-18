/**
 * Storage keys for auth state.
 * - AUTH_ACCESS_TOKEN_KEY: used by backend-aware providers to store JWT access token only.
 * - Default demo provider (default-auth-provider) uses a separate key "_kdid" for a serialized user blob; do not mix with token storage.
 */
export const AUTH_ACCESS_TOKEN_KEY = "_access_token"
