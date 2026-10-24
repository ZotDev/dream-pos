"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook up a server-side error reporter here when one is configured.
    console.error("Dream POS route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main
      role="alert"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#64748b" }}>
          DREAM POS
        </p>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          The page could not be loaded. Your existing records have not been intentionally changed by this error screen.
          Try again, or return to the dashboard.
        </p>
        {error.digest ? (
          <p style={{ fontSize: 12, color: "#64748b" }}>Reference: {error.digest}</p>
        ) : null}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button
            onClick={() => reset()}
            style={{ border: 0, borderRadius: 8, padding: "10px 16px", background: "#0f172a", color: "white", cursor: "pointer" }}
          >
            Try again
          </button>
          <a href="/" style={{ borderRadius: 8, padding: "10px 16px", border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none" }}>
            Dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
