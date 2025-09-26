import React, { useEffect, useMemo, useState } from "react";
import { BRAND, GREETING, PLAN_OPTIONS, SERVICE_OPTIONS, BOOKING_MODE } from "../lib/config";

type Customer = { id: number; name: string; code?: string; phone?: string; address?: string };
type CustomersResp = { ok: true; data: Customer[] } | { ok: false; error: string };

type AvailabilityResp = { ok: true; data: string[] } | { ok: false; error: string };

type PostResp =
  | {
      ok: true;
      id: string;
      customerId: number;
      date: string;
      time: string;
      plan?: string;
      service?: string;
      notes?: string;
      createdAt: string;
    }
  | { ok: false; error: string };

const fmtDate = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);

function prettyISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isPastDate(iso: string) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const today = new Date();
    const todayIso = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    )
      .toISOString()
      .slice(0, 10);
    return iso < todayIso;
  } catch {
    return false;
  }
}

export default function BookingClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");

  // Public inputs (no dropdown)
  const [publicName, setPublicName] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [publicAddress, setPublicAddress] = useState("");

  const [date, setDate] = useState<string>(fmtDate(new Date()));
  const [plan, setPlan] = useState<string>(PLAN_OPTIONS[0].value);
  const [service, setService] = useState<string>(SERVICE_OPTIONS[0].value);
  const [notes, setNotes] = useState<string>("");

  const [times, setTimes] = useState<string[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [msgKind, setMsgKind] = useState<"success" | "error" | "info">("info");
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (BOOKING_MODE !== "admin") return;
    (async () => {
      const r = await fetch("/api/customers?limit=200");
      const j = (await r.json()) as CustomersResp;
      if ("ok" in j && j.ok) {
        setCustomers(j.data);
        if (j.data.length && customerId === "") setCustomerId(j.data[0].id);
      }
    })();
  }, [customerId]);

  function validateBasics(): string | null {
    if (!date) return "Please choose a date.";
    if (isPastDate(date)) return "Please choose a future date.";
    if (!plan) return "Please select a plan.";
    if (!service) return "Please select a service.";

    if (BOOKING_MODE === "admin") {
      if (!customerId) return "Please pick a customer.";
    } else {
      if (!publicName.trim()) return "Please enter your name.";
    }
    return null;
  }

  async function checkAvailability() {
    setTimes([]);
    setHasChecked(false);
    const v = validateBasics();
    if (v) {
      setMessage(v);
      setMsgKind("error");
      return;
    }
    setLoadingAvail(true);
    try {
      const url = `/api/availability?date=${encodeURIComponent(
        date
      )}&plan=${encodeURIComponent(plan)}&service=${encodeURIComponent(
        service
      )}`;
      const r = await fetch(url);
      const j = (await r.json()) as AvailabilityResp;
      if (!("ok" in j) || !j.ok) throw new Error("Failed to load availability");
      setTimes(j.data);
      setHasChecked(true);
      setMessage(j.data.length ? "" : `No open times for ${prettyISO(date)}.`);
      setMsgKind(j.data.length ? "info" : "info");
    } catch (e: any) {
      setMessage(`Availability error: ${String(e?.message || e)}`);
      setMsgKind("error");
    } finally {
      setLoadingAvail(false);
    }
  }

  async function book(time: string) {
    const v = validateBasics();
    if (v) {
      setMessage(v);
      setMsgKind("error");
      return;
    }
    try {
      const body =
        BOOKING_MODE === "admin"
          ? {
              customerId,
              date,
              time,
              plan,
              service,
              notes,
            }
          : {
              customer: {
                name: publicName.trim(),
                phone: publicPhone.trim() || undefined,
                address: publicAddress.trim() || undefined,
              },
              date,
              time,
              plan,
              service,
              notes,
            };

      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as PostResp;
      if (!("ok" in j) || !j.ok) throw new Error((j as any).error || "Booking failed");

      setMessage(
        `Booked #${j.id} for ${prettyISO(j.date)} at ${j.time}${
          j.plan ? ` — ${j.plan}` : ""
        }${j.service ? ` — ${j.service}` : ""}`
      );
      setMsgKind("success");
      checkAvailability();
    } catch (e: any) {
      setMessage(`Error: ${String(e?.message || e)}`);
      setMsgKind("error");
    }
  }

  const CustomerSelect = useMemo(() => {
    if (BOOKING_MODE !== "admin") return null;
    return (
      <select
        value={customerId}
        onChange={(e) => setCustomerId(Number(e.target.value))}
        style={{ width: "100%", padding: 8 }}
      >
        <option value="">— Select a customer —</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.code ? `— ${c.code}` : ""}
          </option>
        ))}
      </select>
    );
  }, [customers, customerId]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 8px" }}>{BRAND} — Booking</h1>
      <p style={{ margin: "0 0 24px" }}>{GREETING}</p>

      {message ? (
        <div
          style={{
            color: msgKind === "error" ? "crimson" : msgKind === "success" ? "green" : "#333",
            marginBottom: 12,
          }}
        >
          {message}
        </div>
      ) : null}

      {BOOKING_MODE === "admin" ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Customer
          </label>
          {CustomerSelect}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Your name
            </label>
            <input
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              placeholder="Full name"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Phone (optional)
            </label>
            <input
              value={publicPhone}
              onChange={(e) => setPublicPhone(e.target.value)}
              placeholder="Best contact number"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Address (optional)
            </label>
            <input
              value={publicAddress}
              onChange={(e) => setPublicAddress(e.target.value)}
              placeholder="Service address"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={{ width: 280, padding: 8 }}
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Service
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ width: 320, padding: 8 }}
        >
          {SERVICE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, pet info, special instructions…"
          rows={3}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <button
        onClick={checkAvailability}
        disabled={loadingAvail}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: "pointer",
        }}
      >
        {loadingAvail ? "Loading…" : "Check availability"}
      </button>

      {hasChecked && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: "12px 0" }}>
            Available times — {plan} — {service}
          </h3>
          {times.length === 0 ? (
            <div>No open times for {prettyISO(date)}.</div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => book(t)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 12, color: "#666" }}>
        Serving South Central Missouri • {BRAND}
      </div>
    </div>
  );
}
