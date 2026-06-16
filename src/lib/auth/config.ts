import "server-only";

import { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/lib/env";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Lazy load both mongoose connection and UserModel to avoid middleware issues
const getMongoose = async () => {
  try {
    const mod = await import("@/lib/mongoose");
    return mod.connectMongoose;
  } catch {
    return null;
  }
};

const getUserModel = async () => {
  try {
    const mod = await import("@/models/user");
    return mod.User;
  } catch {
    return null;
  }
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  providers: [
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("\n🔐 [CREDENTIALS] authorize() called");
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ [CREDENTIALS] No credentials provided");
            return null;
          }

          const parsed = credentialsSchema.parse({
            email: credentials.email,
            password: credentials.password,
          });

          console.log("🔐 [CREDENTIALS] Attempting login for:", parsed.email);

          try {
            const connectMongoose = await getMongoose();
            if (!connectMongoose) {
              console.warn("⚠️ [CREDENTIALS] Mongoose not available");
              return null;
            }

            await connectMongoose();
            console.log("✅ [CREDENTIALS] Connected to MongoDB");

            const UserModel = await getUserModel();
            if (!UserModel) {
              console.warn("⚠️ [CREDENTIALS] UserModel not available");
              return null;
            }

            const user = await UserModel.findOne({ email: parsed.email }).exec();
            
            if (!user) {
              console.log("❌ [CREDENTIALS] User not found:", parsed.email);
              return null;
            }

            console.log("✅ [CREDENTIALS] User found:", parsed.email, "ID:", user._id.toString());

            const isPasswordValid = await bcrypt.compare(parsed.password, user.password);
            
            if (!isPasswordValid) {
              console.log("❌ [CREDENTIALS] Password invalid for:", parsed.email);
              return null;
            }

            console.log("✅ [CREDENTIALS] Password valid for:", parsed.email);

            const returnUser = {
              id: user._id.toString(),
              name: user.displayName || user.name,
              email: user.email,
              image: user.avatarUrl,
            };
            
            console.log("✅ [CREDENTIALS] authorize() returning user:", returnUser);
            return returnUser;
          } catch (dbError) {
            console.error("❌ [CREDENTIALS] MongoDB error:", dbError);
            return null;
          }
        } catch (error) {
          console.error("❌ [CREDENTIALS] Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile, account: signInAccount }) {
      console.log("\n📝 [SIGNIN] signIn() callback called", {
        provider: signInAccount?.provider,
        userEmail: user.email,
      });

      try {
        if (!user.email) {
          console.log("❌ [SIGNIN] No user email");
          return false;
        }

        try {
          const connectMongoose = await getMongoose();
          if (!connectMongoose) {
            console.warn("⚠️ [SIGNIN] Mongoose not available, skipping user creation");
            return true; // Allow credentials login to proceed
          }

          await connectMongoose();

          const UserModel = await getUserModel();
          if (!UserModel) {
            console.warn("⚠️ [SIGNIN] UserModel not available");
            return true;
          }

          let existingUser = await UserModel.findOne({ email: user.email }).exec();

          if (!existingUser) {
            // Create new user for OAuth providers
            if (signInAccount?.provider === "github" || signInAccount?.provider === "google") {
              console.log("📝 [SIGNIN] Creating new OAuth user:", user.email);
              existingUser = await UserModel.create({
                email: user.email,
                name: user.name || profile?.name || "User",
                displayName: user.name || profile?.name,
                avatarUrl: user.image,
                leetcodeUsername: "",
                password: "", // OAuth users don't have passwords
                lastLogin: new Date(),
              });
              console.log("✅ [SIGNIN] OAuth user created:", existingUser._id);
            } else {
              // For credentials, user must be registered first
              console.log("✅ [SIGNIN] Credentials user found, allowing login");
              return true;
            }
          } else {
            // Update last login
            console.log("📝 [SIGNIN] Updating lastLogin for:", user.email);
            existingUser.lastLogin = new Date();
            await existingUser.save();
            console.log("✅ [SIGNIN] lastLogin updated");
          }
        } catch (dbError) {
          console.error("❌ [SIGNIN] MongoDB error:", dbError);
          // For credentials provider, require MongoDB
          if (signInAccount?.provider === "credentials") {
            return false;
          }
          // For OAuth, allow without DB (testing)
          console.warn("⚠️ [SIGNIN] Allowing OAuth login without MongoDB");
        }

        console.log("✅ [SIGNIN] signIn() returning true");
        return true;
      } catch (error) {
        console.error("❌ [SIGNIN] Sign in error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      console.log("\n🔑 [JWT] jwt() callback called", {
        hasUser: !!user,
        tokenSub: token.sub,
        userEmail: user?.email,
      });

      if (user) {
        console.log("🔑 [JWT] User object found in callback, adding to token");
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        console.log("🔑 [JWT] Token updated with user data:", {
          id: token.id,
          email: token.email,
          name: token.name,
        });
      }

      console.log("🔑 [JWT] Returning token:", {
        sub: token.sub,
        id: token.id,
        email: token.email,
      });
      return token;
    },
    async session({ session, token }) {
      console.log("\n📋 [SESSION] session() callback called", {
        tokenId: token.id,
        sessionUserEmail: session.user?.email,
      });

      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        console.log("📋 [SESSION] Session updated with token data:", {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });
      } else {
        console.warn("⚠️ [SESSION] No session.user found");
      }

      console.log("📋 [SESSION] Returning session:", {
        userEmail: session.user?.email,
        userId: session.user?.id,
      });
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
} satisfies NextAuthConfig;
