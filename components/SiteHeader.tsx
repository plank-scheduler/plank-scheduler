import React from "react";
import { BRAND } from "../lib/config";

type Props = {
  subtitle?: string;   // e.g. "— Booking", "— Appointments"
  greeting?: string;   // optional line under the title
};

export default function SiteHeader({ subtitle = "", greeting }: Props) {
  return (
    <header style={{ maxWidth: 980, margin: "0 auto", padding: "16px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <img
          src="/plank-logo.jpg"   // change to /plank-logo.png if you use PNG
          alt={BRAND}
          style={{ maxWidth: "420px", width: "100%", height: "auto", display: "block" }}
        />
      </div>

      <h1 style={{ margin: "8px 0", textAlign: "center" }}>
        {BRAND} {subtitle}
      </h1>

      {greeting ? (
        <p style={{ margin: 0, textAlign: "center" }}>{greeting}</p>
      ) : null}
    </header>
  );
}
