"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/services/db";
import { User as AppUser } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch additional user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        const token = await firebaseUser.getIdTokenResult();
        const claimRole = token.claims.role as AppUser["role"] | undefined;
        const resolvedProfile = profile
          ? claimRole ? { ...profile, role: claimRole } : profile
          : null;

        setAppUser(resolvedProfile);

        // ── Set session cookies for Edge Middleware ──────────────────────────
        // These are soft cookies used ONLY for server-side route gating.
        // Real security stays in Firestore rules + <AuthGuard> Firebase checks.
        const maxAge = 60 * 60; // 1 hour — matches Firebase ID token lifetime
        document.cookie = `__footy_session=1; path=/; max-age=${maxAge}; SameSite=Strict`;
        if (resolvedProfile?.role) {
          document.cookie = `__footy_role=${resolvedProfile.role}; path=/; max-age=${maxAge}; SameSite=Strict`;
        }
      } else {
        setAppUser(null);
        // Clear session cookies on sign-out
        document.cookie = "__footy_session=; path=/; max-age=0";
        document.cookie = "__footy_role=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
