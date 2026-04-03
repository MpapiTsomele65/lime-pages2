import { type ReactNode } from "react";

export function SectionHeader({
  label,
  labelColor = "text-navy",
  children,
  className = "",
}: {
  label: string;
  labelColor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p
        className={`text-xs font-bold tracking-[1.5px] uppercase mb-3.5 ${labelColor}`}
      >
        {label}
      </p>
      <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
        {children}
      </h2>
    </div>
  );
}
