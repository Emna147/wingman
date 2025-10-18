"use client"; // ✅ Important: Mark as client component
import type { auth } from "@/lib/auth"; // Import the auth instance as a type

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

const session = await authClient.getSession({ query: {
    disableCookieCache: true
}});

// ✅ Export useful methods directly
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,              // Get session (async, not reactive)
  listSessions,            // List all user sessions
  revokeSession,           // End a specific session
  revokeOtherSessions,     // End all sessions except current
  revokeSessions,          // End ALL sessions
  changePassword,          // Change password (with optional session revoke)
  
} = authClient;