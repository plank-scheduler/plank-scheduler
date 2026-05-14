// pages/booking.tsx
import { useState } from "react";
import { useRouter } from "next/router";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  service: string;
  date: string;
  time: string;
  notes: string;
};

export default function BookingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    plan: "Initial",
    service: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Send failed");
      }

      // ✅ redirect to thank-you page on success
      router.push("/thanks");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Request Service</h1>
      <form onSubmit={onSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <br />
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={onChange} required />
        </label>
        <br />
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={onChange} required />
        </label>
        <br />
        <label>
          Address
          <input name="address" value={form.address} onChange={onChange} required />
        </label>
        <br />
        <label>
          Plan
          <select name="plan" value={form.plan} onChange={onChange}>
            <option>Initial</option>
            <option>Quarterly</option>
            <option>One-Time</option>
          </select>
        </label>
        <br />
        <label>
          Service
          <input name="service" value={form.service} onChange={onChange} required />
        </label>
        <br />
        <label>
          Preferred Date
          <input type="date" name="date" value={form.date} onChange={onChange} />
        </label>
        <br />
        <label>
          Preferred Time
          <input type="time" name="time" value={form.time} onChange={onChange} />
        </label>
        <br />
        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={onChange} />
        </label>
        <br />
        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Request"}
        </button>
      </form>
      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </main>
  );
}


