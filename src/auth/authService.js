import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

// 1. Import 'doc' and 'setDoc' to write data, and 'db' from your config
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // 👈 Updated to include your db export

// -----------------------------
// Security helpers (client-side)
// -----------------------------

/**
 * Sanitizes user-provided strings to reduce risk of injection into UI.
 * Note: Firebase Auth handles credentials securely; we only use sanitation for UI/state.
 */
export function sanitizeString(input) {
  if (input === undefined || input === null) return "";
  // Remove control characters and trim.
  return String(input)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function normalizeEmail(email) {
  return sanitizeString(email).toLowerCase();
}

export function validateEmailFormat(email) {
  // Basic RFC-compliant-ish email format validation.
  const v = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Password strength enforcement.
 * Minimum 12 characters, at least:
 * - Uppercase
 * - Lowercase
 * - Number
 * - Special character
 */
export function validatePasswordStrength(password) {
  const p = String(password || "");
  const rules = {
    length: p.length >= 12,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p)
  };

  const passed = Object.values(rules).every(Boolean);
  return { passed, rules };
}

// Client-side cooldown to reduce rapid login attempts.
// This is NOT a substitute for server-side/rate-limiting (Firebase does have protections),
// but meets your requirement.
let lastLoginAttemptAtMs = 0;
const LOGIN_COOLDOWN_MS = 15_000;

export function getLoginCooldownRemainingMs() {
  const now = Date.now();
  const elapsed = now - lastLoginAttemptAtMs;
  const remaining = LOGIN_COOLDOWN_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

export function canAttemptLogin() {
  return getLoginCooldownRemainingMs() === 0;
}

export function markLoginAttempt() {
  lastLoginAttemptAtMs = Date.now();
}

// -----------------------------
// Firebase Auth actions
// -----------------------------

export async function signUp({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const { passed } = validatePasswordStrength(password);
  if (!validateEmailFormat(normalizedEmail) || !passed) {
    // Generic error to avoid leaking details.
    throw new Error("INVALID_INPUT");
  }

  // Create user inside Firebase Authentication
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

  // 2. AUTOMATION ADDED HERE: Create matching document profile in Firestore
  // This explicitly uses the matching fields required by your security rules
  await setDoc(doc(db, "users", credential.user.uid), {
    email: credential.user.email,
    role: "employee", // Hardcoded safely to grant default basic access
    area: null,       // Must be null on account creation per rules
    createdAt: new Date()
  });

  // Send verification email (required by your requirements)
  await sendEmailVerification(credential.user);

  return credential.user;
}

export async function login({ email, password, rememberMe }) {
  const normalizedEmail = normalizeEmail(email);
  if (!validateEmailFormat(normalizedEmail)) {
    throw new Error("INVALID_INPUT");
  }

  const { passed } = validatePasswordStrength(password);
  if (!passed) {
    throw new Error("INVALID_INPUT");
  }

  if (!canAttemptLogin()) {
    throw new Error("COOLDOWN");
  }

  // Mark attempt immediately to avoid spamming.
  markLoginAttempt();

  // Persistence based on rememberMe.
  // - rememberMe=true => browserLocalPersistence
  // - else => browserSessionPersistence
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return credential.user;
}

export async function logout() {
  // Firebase signs out the current user.
  await signOut(auth);
}

export async function resetPassword({ email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!validateEmailFormat(normalizedEmail)) {
    throw new Error("INVALID_INPUT");
  }

  await sendPasswordResetEmail(auth, normalizedEmail);
}

export async function requestEmailVerification() {
  const user = auth.currentUser;
  if (!user) throw new Error("NO_USER");
  await sendEmailVerification(user);
}

export function subscribeToAuthChanges(callback) {
  // Firebase listener for session persistence & redirect logic.
  // unsubscribe is returned.
  return onAuthStateChanged(auth, callback);
}

// Re-export auth instance for convenience.
export function getFirebaseAuthInstance() {
  return getAuth();
}
