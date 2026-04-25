// src/types/express/index.d.ts
// Augments Express Request with userId field injected by extractUserId middleware

declare namespace Express {
  interface Request {
    userId: string;
  }
}
