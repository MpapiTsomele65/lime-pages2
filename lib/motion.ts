export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
} as const;

export const fadeUpDelay = (delay: number) =>
  ({
    ...fadeUp,
    transition: { ...fadeUp.transition, delay },
  }) as const;

export const staggerContainer = (staggerDelay = 0.1) =>
  ({
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.15 },
    variants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: staggerDelay },
      },
    },
  }) as const;

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  },
} as const;

export const transition = (duration = 0.6, delay = 0, ease: "easeOut" | "easeInOut" = "easeOut") =>
  ({ duration, delay, ease }) as const;
