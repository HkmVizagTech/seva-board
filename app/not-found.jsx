export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F7F1E3", color: "#20233F", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div>
        <h2 style={{ margin: "0 0 8px" }}>Page not found</h2>
        <a href="/" style={{ color: "#A8721E", fontWeight: 700 }}>Back to the Seva Board</a>
      </div>
    </div>
  );
}
