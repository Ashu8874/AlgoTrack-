import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth-utils";
import { getRecentSubmissions } from "@/lib/leetcode";

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("accepted")) return "badge-ac";
  if (normalized.includes("wrong") || normalized.includes("error")) return "badge-wa";
  return "badge-tle";
}

export default async function SubmissionsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const submissions = await getRecentSubmissions(user.leetcodeUsername, 50);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Submissions</h1>
        <p className="text-[var(--text-secondary)]">Latest 50 submissions from @{user.leetcodeUsername}</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Problem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Runtime</th>
                <th className="px-4 py-3">Memory</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link
                      href={`https://leetcode.com/problems/${submission.titleSlug}`}
                      target="_blank"
                      className="font-medium text-[var(--text-primary)] hover:text-[var(--cyan-400)]"
                    >
                      {submission.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(submission.status)}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{submission.language}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{submission.runtime || "--"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{submission.memory || "--"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(submission.timestamp * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
