"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import SetupNotice from "@/components/SetupNotice";
import { isAdmin, loadProfile } from "@/lib/session";
import { finishSignIn, maskPhone, resolverFrom, smsError, startSignIn } from "@/lib/mfa";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOT_ADMIN = "This account doesn't have admin access.";

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

/** Admin log in only: no sign-up here (admins are set by hand in Firestore). */
export default function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(params.get("denied") ? NOT_ADMIN : "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // SMS second factor: { resolver, hint, verificationId }
  const [mfa, setMfa] = useState(null);
  const [code, setCode] = useState("");
  const recaptchaHost = useRef(null);
  const handling = useRef(false);

  // Already signed in as an admin? Go straight to the panel.
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth, async (u) => {
      if (!u || handling.current) return;
      try {
        if (isAdmin(await loadProfile(u.uid))) router.replace("/");
        else await signOut(auth);
      } catch {
        /* stay on the form */
      }
    });
  }, [router]);

  async function enter(user) {
    let profile = null;
    try {
      profile = await loadProfile(user.uid);
    } catch {
      profile = null;
    }
    if (isAdmin(profile)) {
      router.replace("/");
      return;
    }
    await signOut(auth).catch(() => {});
    handling.current = false;
    setMfa(null);
    setPassword("");
    setError(NOT_ADMIN);
    setBusy(false);
  }

  async function sendLoginCode(state) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const verificationId = await startSignIn(state.resolver, state.hint, recaptchaHost.current);
      setMfa({ ...state, verificationId });
      setCode("");
      setNotice(`We sent a 6-digit code to ${maskPhone(state.hint.phoneNumber)}.`);
    } catch (err) {
      setMfa({ ...state, verificationId: null });
      setError(smsError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from the SMS.");
      return;
    }
    setBusy(true);
    try {
      const cred = await finishSignIn(mfa.resolver, mfa.verificationId, code);
      await enter(cred.user);
    } catch (err) {
      setError(smsError(err));
      setBusy(false);
    }
  }

  function cancelMfa() {
    handling.current = false;
    setMfa(null);
    setCode("");
    setPassword("");
    setError("");
    setNotice("");
  }

  function checkEmail() {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return false;
    }
    return true;
  }

  async function resetPassword() {
    setError("");
    setNotice("");
    if (!checkEmail()) return;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`If ${email.trim()} has an account, a reset link is on its way.`);
    } catch (err) {
      setError(friendlyError(err.code));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!checkEmail()) return;
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    handling.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await enter(cred.user);
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        setBusy(false);
        await sendLoginCode(resolverFrom(err));
        return;
      }
      handling.current = false;
      setError(friendlyError(err.code));
      setBusy(false);
    }
  }

  if (!firebaseReady) return <SetupNotice />;

  if (mfa) {
    return (
      <div className="auth-wrap">
        <section className="panel">
          <h1>Enter the SMS code</h1>
          <p className="sub">
            2-step verification is on for this account. We sent a code to{" "}
            {maskPhone(mfa.hint?.phoneNumber)}.
          </p>
          <form onSubmit={submitCode} noValidate>
            {error && <p className="error" role="alert">{error}</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <div className="field">
              <label htmlFor="otp">6-digit code</label>
              <input
                id="otp"
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-violet btn-block" disabled={busy || !mfa.verificationId}>
              {busy ? "Please wait..." : "Verify and log in"}
            </button>
          </form>
          <p className="switch">
            <button type="button" className="link-btn" onClick={() => sendLoginCode(mfa)} disabled={busy}>
              Resend code
            </button>
            {" · "}
            <button type="button" className="link-btn" onClick={cancelMfa} disabled={busy}>
              Back to log in
            </button>
          </p>
          <div ref={recaptchaHost} />
        </section>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <section className="panel">
        <h1>Admin log in</h1>
        <p className="sub">Only accounts with the admin role can open this panel.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="notice" role="status">{notice}</p>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="button" className="link-btn forgot" onClick={resetPassword}>
            Forgot password?
          </button>

          <label className="check">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>

          <button type="submit" className="btn btn-violet btn-block" disabled={busy}>
            {busy ? "Please wait..." : "Log in"}
          </button>
        </form>
        {/* invisible reCAPTCHA for the SMS code lives here */}
        <div ref={recaptchaHost} />
      </section>
    </div>
  );
}
