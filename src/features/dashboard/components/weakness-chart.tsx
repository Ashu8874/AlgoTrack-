"use client";

import type { LeetCodeSolvedStats } from "@/lib/leetcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SkillData {
  tagName: string;
  problemsSolved: number;
}

interface WeakestTopic {
  name: string;
  solved: number;
}

type WeaknessChartProps = {
  stats: LeetCodeSolvedStats | null;
};

export function WeaknessChart({ stats }: WeaknessChartProps) {
  const skillStats: SkillData[] = [];

  // Get top 5 weakest topics (sorted by solved count ascending)
  const weakestTopics = (skillStats as SkillData[])
    .filter((skill: SkillData) => skill.tagName && skill.problemsSolved)
    .sort((a: SkillData, b: SkillData) => a.problemsSolved - b.problemsSolved)
    .slice(0, 5)
    .map((skill: SkillData) => ({
      name: skill.tagName.substring(0, 12),
      solved: skill.problemsSolved,
    } as WeakestTopic));

  return (
    <Card className="glass border-border/50 bg-gradient-to-br from-orange-600/10 to-orange-700/10 col-span-1">
      <CardHeader>
        <CardTitle>Weakest Topics</CardTitle>
        <CardDescription>Top 5 topics with least problems solved</CardDescription>
      </CardHeader>
      <CardContent>
        {weakestTopics.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weakestTopics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 15, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="solved"
                fill="#f97316"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-muted-foreground">No topic data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
