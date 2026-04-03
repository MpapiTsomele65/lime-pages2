import { type ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[1200px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] ${className}`}>
      {children}
    </div>
  );
}
