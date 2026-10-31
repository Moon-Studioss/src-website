import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

import ws from "ws";

// Force using the `ws` package instead of native fetch/WebSocket.
// Next.js sometimes polyfills `globalThis.WebSocket` with a buggy implementation
// that leads to "TypeError: fetch failed" during Server Actions or Revalidation.
neonConfig.webSocketConstructor = ws;

// Disable pipelining so queries are never sent before the WebSocket
// handshake completes — this prevents the "Failed query" race condition
// that occurs on cold starts.
neonConfig.pipelineConnect = false;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL! });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

/**
 * Wraps a database query function with automatic retries.
 * Handles Neon cold-start failures silently — the user will never
 * see an error that goes away on its own after a refresh.
 *
 * @param fn    - An async function that performs the DB query.
 * @param tries - Number of attempts (default: 5).
 */
export async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === tries) {
        // Drizzle's "Failed query" hides the real reason (network down, DB asleep…) in `cause`,
        // often a WebSocket ErrorEvent whose readable text is in .message / .error
        const cause = (err as { cause?: { message?: string; error?: unknown } })?.cause;
        console.error(`[db] query failed after ${tries} tries:`, cause?.message || cause?.error || cause || err);
        throw err;
      }
      // Wait 1.5s between retries to give the serverless DB time to wake up.
      // Total potential wait: ~6 seconds.
      await new Promise(res => setTimeout(res, 1500));
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error("withRetry: exhausted all attempts");
}

