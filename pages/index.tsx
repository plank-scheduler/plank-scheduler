// pages/index.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Plank Scheduler
      </h1>
      <p>Choose an action:</p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        <li><Link href="/booking">Book an appointment →</Link></li>
        <li><Link href="/appointments">View / cancel appointments →</Link></li>
        <li><Link href="/api/health">API health →</Link></li>
      </ul>
    </main>
  );
}
