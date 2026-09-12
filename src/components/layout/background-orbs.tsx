"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function BackgroundOrbs({ 
  density = "default" 
}: { 
  density?: "default" | "dense" | "minimal" 
}) {
  if (density === "minimal") {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background">
        <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-brand-500/5 rounded-full blur-[120px] animate-ambient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background">
      {/* 1. Brand Orb (Top Left) */}
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute top-[5%] left-[10%] w-[28rem] h-[28rem] rounded-full blur-[140px] motion-reduce:transform-none",
          density === "dense" ? "bg-brand-500/20 dark:bg-brand-500/15" : "bg-brand-500/15 dark:bg-brand-500/10"
        )}
      />
      
      {/* 2. Energy Orb (Bottom Right) */}
      <motion.div
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -30, 0], scale: [1, 1.2, 0.8, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[5%] w-[36rem] h-[36rem] bg-energy-500/10 dark:bg-energy-500/5 rounded-full blur-[140px] motion-reduce:transform-none"
      />

      {/* 3. Muscle Orb (Center Left) */}
      <motion.div
        animate={{ x: [0, 20, -40, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-[35%] left-[30%] w-[24rem] h-[24rem] bg-muscle-500/10 dark:bg-muscle-500/8 rounded-full blur-[120px] motion-reduce:transform-none"
      />

      {/* 4. Performance / Teal Orb (Top Right) */}
      <motion.div
        animate={{ x: [0, -20, 20, 0], y: [0, -30, 30, 0], scale: [1, 1.05, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute top-[15%] right-[25%] w-[20rem] h-[20rem] bg-performance-500/8 dark:bg-performance-500/5 rounded-full blur-[100px] motion-reduce:transform-none"
      />

      {/* 5. Brand Secondary / Glow (Bottom Left) */}
      <motion.div
        animate={{ x: [0, 25, -25, 0], y: [0, 25, -25, 0], scale: [1, 1.15, 0.85, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[20%] left-[15%] w-[26rem] h-[26rem] bg-brand-400/8 dark:bg-brand-400/5 rounded-full blur-[130px] motion-reduce:transform-none"
      />
      
      {/* Subtle Noise / Mesh Overlay for physical glass texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-80" />
    </div>
  );
}
