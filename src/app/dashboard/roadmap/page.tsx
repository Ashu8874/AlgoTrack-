"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const companies = [
  "Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Uber",
  "Adobe", "Airbnb", "Square", "Stripe", "Dropbox", "Twitch", "Discord",
];

const roles = ["SDE-1", "SDE-2", "SDE-3", "Frontend", "Backend", "Full-stack"];
const durations = [4, 8, 12];

export default function RoadmapPage() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("SDE-1");
  const [duration, setDuration] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, duration }),
      });

      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Company Interview Roadmap</h1>
        <p className="text-muted-foreground">Get a personalized preparation plan</p>
      </motion.div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Generate Your Roadmap</CardTitle>
          <CardDescription>Select your target company, role, and prep duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Company Autocomplete */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search companies..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="border-border/30 bg-slate-800/50"
                  list="companies"
                />
                <datalist id="companies">
                  {companies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-border/30 bg-slate-800/50 px-3 py-2 text-sm"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prep Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-border/30 bg-slate-800/50 px-3 py-2 text-sm"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d} weeks
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleGenerate}
              disabled={!company || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isLoading ? "Generating..." : "Generate Roadmap"}
            </Button>
          </motion.div>

          {roadmap && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-lg bg-slate-800/30 p-4 border border-border/30"
            >
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {roadmap}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
