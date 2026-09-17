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
export async function getServerAuthSession(req = null) {
  try {
    const clerk = loadClerkServer();
    if (!clerk) return null;

    if (typeof clerk.auth === 'function') {
      try {
        const session = await clerk.auth();
        if (session && session.userId) return session;
      } catch (authErr) {
        // Fallback to getAuth if auth() fails
      }
    }

    if (req && typeof clerk.getAuth === 'function') {
      try {
        const session = clerk.getAuth(req);
        if (session && session.userId) return session;
      } catch (getAuthErr) {
        // Ignore
      }
    }
  } catch (err) {
    // Auth session not available or in test environment
  }
  return null;
}
