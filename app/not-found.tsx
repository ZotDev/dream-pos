export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section style={{ textAlign: "center", maxWidth: 440 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#64748b" }}>DREAM POS</p>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>This page may have moved, or you may not have the correct link.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16, borderRadius: 8, padding: "10px 16px", background: "#0f172a", color: "white", textDecoration: "none" }}>
          Return to dashboard
        </a>
      </section>
    </main>
  );
}
