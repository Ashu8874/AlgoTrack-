import "server-only";

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { env } from "@/lib/env";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
});
