-- Login rate limiting table (matches model LoginAttempt in prisma/schema.prisma).
-- Run with: npx wrangler d1 execute attendance-db --remote --file=0003_login_attempt.sql
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" DATETIME
);
