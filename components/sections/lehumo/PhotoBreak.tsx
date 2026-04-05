"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PhotoBreakProps {
  src: string;
  alt: string;
  height?: string;
  overlay?: "navy" | "navy-mid" | "none";
  overlayOpacity?: number;
  objectPosition?: string;
}

export function PhotoBreak({
  src,
  alt,
  height = "h-[220px] sm:h-[280px]",
  overlay = "navy",
  overlayOpacity = 0.55,
  objectPosition = "center",
}: PhotoBreakProps) {
  const bgFrom =
    overlay === "navy-mid" ? "from-navy-mid" : "from-navy";
  const bgTo =
    overlay === "navy-mid" ? "to-navy-mid" : "to-navy";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
      className={`relative w-full ${height} overflow-hidden`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        style={{ objectPosition }}
        sizes="100vw"
      />
      {overlay !== "none" && (
        <>
          <div
            className={`absolute inset-0 bg-gradient-to-b ${bgFrom} via-transparent ${bgTo}`}
            style={{ opacity: overlayOpacity }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                overlay === "navy-mid"
                  ? "rgba(15,32,64,0.3)"
                  : "rgba(11,25,51,0.3)",
            }}
          />
        </>
      )}
    </motion.div>
  );
}
