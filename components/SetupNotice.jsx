/* Shown instead of a crash when the Firebase keys are missing. */
export default function SetupNotice() {
  return (
    <div className="auth-wrap">
      <section className="panel">
        <h1>Firebase isn&apos;t connected yet</h1>
        <p className="sub">
          The admin panel needs the same Firebase keys as the website.
        </p>
        <ol className="setup-steps">
          <li>
            Locally: copy <strong>.env.example</strong> to <strong>.env.local</strong> and fill in the values.
          </li>
          <li>
            On Vercel: Project → Settings → Environment Variables → add the same
            <code> NEXT_PUBLIC_FIREBASE_*</code> keys, then redeploy.
          </li>
        </ol>
      </section>
    </div>
  );
}
