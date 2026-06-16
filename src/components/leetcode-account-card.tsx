"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Edit2, ExternalLink, RefreshCw } from "lucide-react";

interface LeetCodeAccountCardProps {
  username: string;
  userEmail: string;
}

interface ProfileApiResponse {
  matchedUser?: {
    profile?: {
      realName?: string | null;
      ranking?: number | null;
    };
  };
}

export function LeetCodeAccountCard({ username }: LeetCodeAccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileData, setProfileData] = useState<ProfileApiResponse | null>(null);

  useEffect(() => {
    // Verify account on mount
    verifyAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyAccount() {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/leetcode/profile?username=${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error verifying account:", error);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
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
          leetcodeUsername: newUsername.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "LeetCode username updated successfully!" });
        setIsEditing(false);
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update username" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect your LeetCode account? This will remove all tracking data.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leetcodeUsername: "",
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        setMessage({ type: "error", text: "Failed to disconnect account" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-username">LeetCode Username</Label>
          <Input
            id="new-username"
            type="text"
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            You can find your username at leetcode.com/u/YOUR_USERNAME
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading || !newUsername.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsEditing(false);
              setNewUsername(username);
              setMessage(null);
            }}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Account Display */}
      <div className="flex items-start justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-4">
          {/* Avatar or Icon */}
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">@{username}</h3>
              {isVerifying ? (
                <Badge variant="outline" className="text-xs">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Verifying...
                </Badge>
              ) : profileData ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : null}
            </div>
            
            {profileData && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {profileData.matchedUser?.profile?.realName || "LeetCode User"}
                </p>
                {profileData.matchedUser?.profile?.ranking && (
                  <p>Ranking: #{profileData.matchedUser.profile.ranking.toLocaleString()}</p>
                )}
              </div>
            )}
            
            <a 
              href={`https://leetcode.com/u/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              View Profile
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="flex-shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={verifyAccount}
          disabled={isVerifying}
          className="flex-1"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isLoading}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}