"use client";

import Link from "next/link";
import { APP_NAME, WEBSITE_URL } from "@/lib/config";

/* Simple bar for the admin site: logo, "Admin" label, link to the public website. */
export default function TopBar({ label = "Admin" }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label={`${APP_NAME} admin home`}>
          <span className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
            </svg>
          </span>
          <span className="grad-text">{APP_NAME}</span>
        </Link>
        {label && <span className="topbar-label">{label}</span>}
        {WEBSITE_URL && (
          <a href={WEBSITE_URL} className="btn-ghost topbar-out" target="_blank" rel="noopener noreferrer">
            View website
          </a>
        )}
      </div>
    </header>
  );
}
