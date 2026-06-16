"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

interface SettingsFormProps {
  currentUsername: string;
  userEmail: string;
}

export function SettingsForm({ currentUsername, userEmail }: SettingsFormProps) {
  const [leetcodeUsername, setLeetcodeUsername] = useState(currentUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leetcodeUsername: leetcodeUsername.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "LeetCode account connected successfully!" });
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to connect account" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="leetcode-username">LeetCode Username</Label>
        <Input
          id="leetcode-username"
          type="text"
          placeholder="Enter your LeetCode username"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          required
          disabled={isLoading}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Find your username at{" "}
          <a 
            href="https://leetcode.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            leetcode.com/u/YOUR_USERNAME
          </a>
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || !leetcodeUsername.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting Account...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {currentUsername ? "Update" : "Connect"} LeetCode Account
          </>
        )}
      </Button>
    </form>
  );
}