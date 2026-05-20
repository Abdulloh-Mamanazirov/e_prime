"use client";

import { motion } from "framer-motion";

interface ScoreMeterProps {
  score: number;
  size?: number;
}

export default function ScoreMeter({ score, size = 64 }: ScoreMeterProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 80 ? "score-high" : score >= 50 ? "score-mid" : "score-low";

  const strokeColor =
    score >= 80
      ? "var(--accent-emerald)"
      : score >= 50
      ? "var(--accent-yellow)"
      : "var(--accent-red)";

  return (
    <div className={`relative inline-flex items-center justify-center ${colorClass}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={4}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-bold font-mono"
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round(score)}
          <span style={{ fontSize: size * 0.14 }}>%</span>
        </span>
      </div>
    </div>
  );
}
