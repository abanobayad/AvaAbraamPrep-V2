// Runs once when the Next.js server starts (Node.js runtime only).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapDatabase } = await import("./lib/bootstrap");
    await bootstrapDatabase();
  }
}
