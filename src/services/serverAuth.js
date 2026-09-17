import { createRequire } from 'module';

let clerkServer = null;

function loadClerkServer() {
  if (clerkServer) return clerkServer;
  try {
    const require = createRequire(import.meta.url);
    clerkServer = require('@clerk/nextjs/server');
    return clerkServer;
  } catch (err) {
    return null;
  }
}

/**
 * Returns current Clerk server auth session (userId, sessionId, etc.)
 */
export function getServerAuthSession(req = null) {
  try {
    const clerk = loadClerkServer();
    if (clerk && typeof clerk.auth === 'function') {
      return clerk.auth();
    }
  } catch (err) {
    // Auth session not available or in test environment
  }
  return null;
}
