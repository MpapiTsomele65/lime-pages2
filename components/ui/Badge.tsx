"use client";

export function Badge({
  children,
  variant = "teal",
  pulse = false,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "teal" | "lime" | "navy";
  pulse?: boolean;
  className?: string;
}) {
  const styles = {
    teal: "bg-teal-dim border-teal/35 text-teal",
    lime: "bg-lime-dim border-lime/25 text-lime",
    navy: "bg-navy/6 border-navy/15 text-navy",
  };

  const dotStyles = {
    teal: "bg-teal",
    lime: "bg-lime",
    navy: "bg-navy",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-[18px] py-[7px] text-[11px] font-semibold tracking-[1.2px] uppercase border ${styles[variant]} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} animate-[pulse_2s_ease_infinite]`}
        />
      )}
      {children}
    </span>
  );
}
