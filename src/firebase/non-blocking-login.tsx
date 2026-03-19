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
  signInAnonymously(authInstance).catch((err) => {
    console.error("Anonymous Sign-in Error:", err.code, err.message);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // Catch error to prevent runtime crash on failed attempts
  createUserWithEmailAndPassword(authInstance, email, password).catch((err) => {
    console.error("Sign-up Error:", err.code, err.message);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // Catch error to prevent runtime crash on failed attempts (e.g., invalid-credential)
  signInWithEmailAndPassword(authInstance, email, password).catch((err) => {
    console.error("Sign-in Error:", err.code, err.message);
  });
}
