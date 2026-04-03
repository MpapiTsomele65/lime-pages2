"use client";

interface MarqueeProps {
  items: string[];
  speed?: number;
  className?: string;
}

export default function Marquee({ items, speed = 30, className }: MarqueeProps) {
  const content = items.map((item, i) => (
    <span key={i} className="inline-flex items-center">
      <span>{item}</span>
      <span className="mx-4 text-white/30">&bull;</span>
    </span>
  ));

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}>
      <div
        className="inline-flex animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="inline-flex">{content}</div>
        <div className="inline-flex">{content}</div>
      </div>
    </div>
  );
}
