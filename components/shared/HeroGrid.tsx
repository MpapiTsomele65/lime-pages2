"use client";

interface HeroGridProps {
  opacity?: number;
  lineColor?: string;
}

export default function HeroGrid({
  opacity = 0.05,
  lineColor = "rgba(255,255,255,0.05)",
}: HeroGridProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(to right, ${lineColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}
