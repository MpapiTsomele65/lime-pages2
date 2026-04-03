"use client";

interface GlowOrbProps {
  color: "teal" | "lime" | "lime-bright";
  size?: number;
  className?: string;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

const colorMap = {
  teal: "rgba(70, 205, 207, 0.3)",
  lime: "rgba(163, 230, 53, 0.3)",
  "lime-bright": "rgba(190, 242, 100, 0.4)",
};

export default function GlowOrb({
  color,
  size = 500,
  className,
  position,
}: GlowOrbProps) {
  const gradientColor = colorMap[color];

  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        top: position?.top,
        left: position?.left,
        right: position?.right,
        bottom: position?.bottom,
        background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
        filter: "blur(80px)",
      }}
    />
  );
}
