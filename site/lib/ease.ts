export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING_BOUNCE = {
  type: "spring",
  stiffness: 480,
  damping: 24,
  mass: 0.7,
} as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;
