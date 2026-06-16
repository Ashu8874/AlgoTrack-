"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Github, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log("📝 [LOGIN PAGE] handleSubmit called for:", email);

    try {
      console.log("📝 [LOGIN PAGE] Calling signIn with credentials");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("📝 [LOGIN PAGE] signIn result:", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
      });

      if (result?.error) {
        console.log("❌ [LOGIN PAGE] signIn error:", result.error);
        setError("Invalid email or password");
      } else if (result?.ok) {
        console.log("✅ [LOGIN PAGE] signIn succeeded, redirecting to /dashboard");
        // Use router.push to redirect after successful login
        router.push("/dashboard");
      } else {
        console.log("❌ [LOGIN PAGE] signIn returned but not ok");
        setError("An error occurred. Please try again.");
      }
    } catch (err) {
      console.error("❌ [LOGIN PAGE] Exception:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: "github" | "google") => {
    console.log("📝 [LOGIN PAGE] handleOAuthSignIn called for:", provider);
    signIn(provider, { redirect: false }).then((result) => {
      console.log("📝 [LOGIN PAGE] OAuth signIn result:", {
        provider,
        ok: result?.ok,
        error: result?.error,
      });
      if (result?.ok) {
        console.log("✅ [LOGIN PAGE] OAuth succeeded, redirecting to /dashboard");
        router.push("/dashboard");
      } else {
        console.log("❌ [LOGIN PAGE] OAuth failed:", result?.error);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription>Sign in to your LeetCode Progress Analyzer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                className="w-full border-border/50 bg-slate-800/50 hover:bg-slate-700/50"
                onClick={() => handleOAuthSignIn("github")}
                disabled={isLoading}
              >
                <Github className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                className="w-full border-border/50 bg-slate-800/50 hover:bg-slate-700/50"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Google</span>
              </Button>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/50 px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="border-border/30 bg-slate-800/50 placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-border/30 bg-slate-800/50 pr-10 placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border/30 bg-slate-800/50"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </motion.div>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
