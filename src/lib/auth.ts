import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "@/db";

export const auth = betterAuth({
  database: mongodbAdapter(await getDb()), // pass real Db instance
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // ✅ Recommended settings for better UX
      accessType: "offline", // Always get refresh token
      prompt: "select_account consent", // Always show account selector
    },
  },
    session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
    
    // ✅ Add cookie caching
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes (good balance)
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
