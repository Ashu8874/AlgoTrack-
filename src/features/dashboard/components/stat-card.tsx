"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color: string;
};

export function StatCard({ title, value, suffix = "", icon: Icon, color }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let animationFrame: number;
    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayValue(Math.floor(value * progress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, isMounted]);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Card className={`glass group overflow-hidden p-6 cursor-pointer relative border-border/50 bg-gradient-to-br ${color}/10`}>
        <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className="h-32 w-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={`bg-gradient-to-br ${color} p-2 rounded-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-4xl font-bold text-white">
              {displayValue.toLocaleString()}
              {suffix}
            </p>
            <p className="text-xs text-muted-foreground">
              Updated just now
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
