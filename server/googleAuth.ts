import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    // Register a route that explains the issue instead of silently failing
    app.get("/api/auth/google", (_req, res) => {
      res.redirect("/login?error=google_not_configured");
    });
    console.log("Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable");
    return;
  }

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.REPLIT_DEPLOYMENT;
  let callbackURL: string;
  if (process.env.GOOGLE_CALLBACK_URL) {
    callbackURL = process.env.GOOGLE_CALLBACK_URL;
  } else if (isProduction) {
    callbackURL = "https://tenant-track.com/api/auth/google/callback";
  } else {
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    callbackURL = devDomain
      ? `https://${devDomain}/api/auth/google/callback`
      : "https://tenant-track.com/api/auth/google/callback";
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), undefined);

          // Find or create user
          let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

          if (!user) {
            const newId = crypto.randomUUID();
            [user] = await db.insert(users).values({
              id: newId,
              email,
              firstName: profile.name?.givenName || profile.displayName || "",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value || null,
              subscriptionTier: "free",
            }).returning();
          } else if (!user.profileImageUrl && profile.photos?.[0]?.value) {
            await db.update(users).set({ profileImageUrl: profile.photos[0].value }).where(eq(users.id, user.id));
          }

          const sessionUser = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
            },
            isLocalAuth: true,
          };

          done(null, sessionUser as any);
        } catch (err) {
          done(err as Error, undefined);
        }
      }
    )
  );

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login?error=google_failed" }),
    (_req, res) => {
      res.redirect("/");
    }
  );

  console.log("Google OAuth configured — callback:", callbackURL);
}
