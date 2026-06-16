import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { getAuthUser } from "@/lib/auth-utils";
import { getGoals, getGoalProgress } from "@/lib/repositories";

export default async function GoalsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const goals = await getGoals(user._id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Goals</h1>
        <p className="text-[var(--text-secondary)]">Track your target milestones and completion rate</p>
      </div>

      {goals.length === 0 ? (
        <div className="glass-card flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
          <Target className="h-12 w-12 text-[var(--text-muted)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">No goals yet</h2>
          <p className="text-[var(--text-secondary)]">Create your first goal from the API or settings flow.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getGoalProgress(goal);
            return (
              <div key={goal.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{goal.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{goal.description || "No description"}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[var(--text-muted)]">
                    {goal.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{goal.currentCount} / {goal.targetCount}</span>
                  <span className="font-semibold text-[var(--purple-300)]">{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--purple-500)] to-[var(--cyan-400)]" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">Target date: {new Date(goal.targetDate).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
