import rateLimit from "express-rate-limit";

// ─── SIGNAL LIMITER ───────────────────────────────────────
export const signalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  trustProxy: true,
  message: {
    success: false,
    error: "Too many signals sent. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── DROP LIMITER ─────────────────────────────────────────
export const dropLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  trustProxy: true,
  message: {
    success: false,
    error: "Too many drops created. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── AUTH LIMITER ─────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  trustProxy: true,
  message: {
    success: false,
    error: "Too many login attempts. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  trustProxy: true,
  message: {
    success: false,
    error: "AI rate limit reached. Please wait a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GHOST LIMITER ────────────────────────────────────────
export const ghostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  trustProxy: true,
  message: {
    success: false,
    error: "Slow down on the ghost queue.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GENERAL LIMITER ──────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: true,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});