import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/repositories";
import { SettingsForm } from "@/components/settings-form";
import { LeetCodeAccountCard } from "@/components/leetcode-account-card";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await getUser({ email: session.user.email });
  
  if (!user) {
    redirect("/auth/login");
  }

  const hasLeetCodeAccount = !!user.leetcodeUsername;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and integrations
          </p>
        </div>

        {/* LeetCode Account Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                </svg>
                LeetCode Integration
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {hasLeetCodeAccount 
                  ? "Your LeetCode account is connected"
                  : "Connect your LeetCode account to start tracking progress"
                }
              </p>
            </div>
            {hasLeetCodeAccount && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-500 font-medium">Connected</span>
              </div>
            )}
          </div>

          {hasLeetCodeAccount ? (
            <LeetCodeAccountCard 
              username={user.leetcodeUsername}
              userEmail={user.email}
            />
          ) : (
            <div className="bg-muted/50 border-2 border-dashed rounded-lg p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">No LeetCode Account Connected</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Connect your LeetCode account to unlock powerful features like progress tracking, 
                    AI insights, weakness analysis, and personalized roadmaps.
                  </p>
                </div>
                <SettingsForm 
                  currentUsername="" 
                  userEmail={user.email}
                />
              </div>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-white font-medium">{user.name}</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <label className="text-sm font-medium text-muted-foreground">Account Type</label>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                {user.provider}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-white font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}