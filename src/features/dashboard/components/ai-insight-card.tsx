"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AiInsightCardProps = {
  username: string;
};

export function AiInsightCard({ username }: AiInsightCardProps) {
  const [insight, setInsight] = useState("");
  const [displayedInsight, setDisplayedInsight] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const res = await fetch(`/api/ai/insight?username=${username}`);
        if (res.ok) {
          const data = await res.json();
          setInsight(data.insight);
        }
      } catch (error) {
        console.error("Failed to fetch insight:", error);
        setInsight(
          "Keep grinding! Your consistent effort on LeetCode is building strong problem-solving skills. Focus on quality over quantity."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [username]);

  // Typewriter effect
  useEffect(() => {
    if (isLoading || !insight) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= insight.length) {
        setDisplayedInsight(insight.substring(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [insight, isLoading]);

  return (
    <Card className="glass border-border/50 bg-gradient-to-br from-purple-600/10 to-purple-700/10 col-span-1 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle>AI Daily Digest</CardTitle>
            <CardDescription>Powered by Groq</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slate-700/50 animate-pulse" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">
              {displayedInsight}
              {displayedInsight.length < insight.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-2 h-5 ml-1 bg-purple-400 rounded-sm"
                />
              )}
            </p>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
