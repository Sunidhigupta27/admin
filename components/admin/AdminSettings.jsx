"use client";

import { TIERS, formatCount } from "@/lib/config";
import { ADMIN_SECTIONS } from "@/components/admin/AdminSidebar";

/**
 *   profile, uid           – signed-in admin
 *   prefs / onPrefs(patch) – { startSection, collapsed } saved in this browser
 *   onRefresh()            – reload users, ads and social accounts
 */
export default function AdminSettings({ profile, uid, prefs, onPrefs, onRefresh, refreshing }) {
  return (
    <div className="set-grid">
      <section className="dcard set-card">
        <h2>Your admin account</h2>
        <dl className="set-dl">
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
          <div><dt>Role</dt><dd><span className="role-tag rt-admin">admin</span></dd></div>
        </dl>
      </section>

      <section className="dcard set-card">
        <h2>Preferences</h2>
        <p className="set-note">Saved in this browser only.</p>
        <label className="set-row">
          <span>
            <strong>Open the admin panel on</strong>
            <span className="sub-cell">Section shown after you sign in</span>
          </span>
          <select
            className="dsel"
            value={prefs.startSection}
            onChange={(e) => onPrefs({ startSection: e.target.value })}
          >
            {ADMIN_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="set-row">
          <span>
            <strong>Compact sidebar</strong>
            <span className="sub-cell">Icons only, on wide screens</span>
          </span>
          <input
            type="checkbox"
            className="set-switch"
            checked={prefs.collapsed}
            onChange={(e) => onPrefs({ collapsed: e.target.checked })}
          />
        </label>
        <div className="set-row">
          <span>
            <strong>Reload data</strong>
            <span className="sub-cell">Fetch users, ads and social accounts again</span>
          </span>
          <button type="button" className="act" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Reloading…" : "Reload"}
          </button>
        </div>
      </section>

      <section className="dcard set-card">
        <h2>Follower tiers</h2>
        <p className="set-note">A creator&apos;s tier comes from their biggest account.</p>
        <ul className="set-tiers">
          {TIERS.map((t, i) => {
            const next = TIERS[i + 1];
            return (
              <li key={t.name}>
                <strong>{t.name}</strong>
                <span>{next ? `${formatCount(t.min)} – ${formatCount(next.min - 1)}` : `${formatCount(t.min)}+`}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}