import { useRouter } from "next/router";

function prettyISO(iso: string | string[] | undefined) {
  if (!iso || Array.isArray(iso)) return "";

  const [y, m, d] = iso.split("-").map(Number);

  if (!y || !m || !d) return iso;

  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
}

export default function ThanksPage() {
  const router = useRouter();

  const date = prettyISO(router.query.date);
  const time = typeof router.query.time === "string" ? router.query.time : "";

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "80px auto",
        padding: "24px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#1f7a34", marginBottom: 12 }}>Thank You!</h1>

      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        We received your service request.
      </p>

      {date && time ? (
        <p style={{ fontSize: 16, lineHeight: 1.5 }}>
          Requested appointment time: <strong>{date} at {time}</strong>
        </p>
      ) : null}

      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        Our office will review your request and contact you to confirm the appointment.
      </p>

      <p style={{ marginTop: 28, fontWeight: 700 }}>
        The Plank Team
        <br />
        www.plankpest.com
      </p>
    </main>
  );
}