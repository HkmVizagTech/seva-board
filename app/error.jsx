"use client";

export default function Error({ reset }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F7F1E3", color: "#20233F", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div>
        <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
        <p style={{ margin: "0 0 16px", color: "#6E664F" }}>Your tasks are safe — this is only a display problem. Try again, or reload the page.</p>
        <button onClick={() => reset()} style={{ background: "#E08A1E", color: "#25284A", border: "1px solid #C79A3E", borderRadius: 9, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );
}
