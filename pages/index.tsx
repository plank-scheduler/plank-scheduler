import { GREETING, COMPANY_NAME } from "@/lib/config";

export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: "32px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>{COMPANY_NAME}</h1>
      <p style={{ marginTop: 8 }}>{GREETING}</p>
      {/* …rest of your content… */}
    </main>
  );
}
