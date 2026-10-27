"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { LOGIN_PATH } from "@/lib/config";

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function isAdmin(profile) {
  return profile?.role === "admin";
}

/**
 * Admin-site guard. Only users whose Firestore profile has role "admin"
 * get in; everyone else is signed out and sent to /login.
 *
 * Same return shape as the website's useSession:
 * { user, profile, ready, notConfigured }. The argument is ignored and only
 * kept so existing calls like useSession({ allow: ["admin"] }) still work.
 */
// eslint-disable-next-line no-unused-vars
export function useSession(_opts = {}) {
  const router = useRouter();
  const [state, setState] = useState({ user: null, profile: null, ready: false });

  useEffect(() => {
    if (!firebaseReady) return;
    let alive = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace(LOGIN_PATH);
        return;
      }
      let profile = null;
      try {
        profile = await loadProfile(user.uid);
      } catch {
        profile = null;
      }
      if (!alive) return;
      if (!isAdmin(profile)) {
        await signOut(auth).catch(() => {});
        router.replace(`${LOGIN_PATH}?denied=1`);
        return;
      }
      setState({ user, profile, ready: true });
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [router]);

  return firebaseReady ? state : { ...state, notConfigured: true };
}
