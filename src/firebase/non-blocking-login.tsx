'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // Catch error to prevent runtime crash on failed attempts
  signInAnonymously(authInstance).catch(() => {
    // Error is intentionally swallowed here to avoid console noise; 
    // real-time auth state listeners should handle the UI state.
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // Catch error to prevent runtime crash on failed attempts
  createUserWithEmailAndPassword(authInstance, email, password).catch(() => {
    // Error is intentionally swallowed
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // Catch error to prevent runtime crash on failed attempts (e.g., invalid-credential)
  signInWithEmailAndPassword(authInstance, email, password).catch(() => {
    // Error is intentionally swallowed to prevent triggering the development error overlay.
  });
}
