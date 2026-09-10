/**
 * Authentication Service
 * Manages persistent user sessions, registration, and studio protection
 */

const STORAGE_KEY = 'aethercraft_auth_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loginUser(email, password) {
  // Real simulated backend auth with local persistence
  const user = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email,
    name: email.split('@')[0],
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(email)}`,
    joinedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function guestLogin() {
  const user = {
    id: 'usr_guest',
    email: 'alex@aethercraft.dev',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    joinedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEY);
}
