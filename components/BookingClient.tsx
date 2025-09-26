"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ──────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────── */
type Customer = {
  id: number;
  name: string;
  accountNo?: string;
};

type AvailabilitySlot = {
  time: string; // "HH:mm"
};

type Appointment = {
  id: string;
  customerId: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  service?: string;
  plan?: string;
  notes?: string;
  createdAt: string;
};

/** ──────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────── */
async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ──────────────────────────────────────────────────────────────
 * Plans & Services (Missouri coverage)
 * ────────────────────────────────────────────────────────────── */
const PLANS = [
  "Initial Service",
  "Quarterly",
  "Tri-Annual",
  "Bi-Monthly",
  "Monthly",
  "Bi-Annual",
  "Annual",
  "One-Time",
];

type ServiceOption = { value: string; label: string };

const SERVICES: { group: string; items: ServiceOption[] }[] = [
  {
    group: "General Pest",
    items: [
      { value: "general-residential", label: "General Residential Pest Control" },
      { value: "general-commercial", label: "General Commercial Pest Control" },
      { value: "spiders", label: "Spiders" },
      { value: "ants", label: "Ants (excluding carpenter ants)" },
      { value: "carpenter-ants", label: "Carpenter Ants" },
      { value: "roaches", label: "Cockroaches (German/American/etc.)" },
      { value: "fleas", label: "Fleas" },
      { value: "ticks", label: "Ticks (yard/structure)" },
      { value: "wasps-bees", label: "Wasps / Hornets / Ground Bees" },
      { value: "silverfish", label: "Silverfish / Firebrats" },
      { value: "earwigs-centipedes", label: "Earwigs / Centipedes / Millipedes" },
      { value: "stink-bugs", label: "Stink Bugs / Seasonal Invaders" },
      { value: "pantry-pests", label: "Pantry Pests (Indian Meal Moth, Beetles)" },
    ],
  },
  {
    group: "Termites",
    items: [
      { value: "termite-inspection", label: "Termite Inspection (WDI/WDO Letter)" },
      { value: "termite-liquid", label: "Termite Treatment — Liquid Soil Treatment" },
      { value: "termite-bait", label: "Termite Bait System (Install & Maintain)" },
      { value: "termite-renewal", label: "Termite Service Renewal" },
      { value: "termite-preconstruction", label: "Pre-Construction Soil Treatment" },
    ],
  },
  {
    group: "Bed Bugs",
    items: [
      { value: "bedbug-inspection", label: "Bed Bug Inspection" },
      { value: "bedbug-chemical", label: "Bed Bug Treatment — Chemical" },
      { value: "bedbug-heat", label: "Bed Bug Treatment — Heat" },
      { value: "bedbug-followup", label: "Bed Bug Follow-Up" },
    ],
  },
  {
    group: "Wildlife / Rodents / Birds",
    items: [
      { value: "mice-rats", label: "Rodents — Mice / Rats (interior & exterior)" },
      { value: "squirrels", label: "Squirrels — Exclusion / Trapping" },
      { value: "raccoon-opossum", label: "Raccoon / Opossum — Trapping / Exclusion" },
      { value: "skunk", label: "Skunk — Trapping / Exclusion" },
      { value: "bats", label: "Bats — Inspection / Exclusion (no-kill, sealed entry)" },
      { value: "birds", label: "Birds — Nest Removal / Exclusion" },
      { value: "vole-gopher", label: "Vole / Gopher Yard Program" }, // (you removed moles earlier)
      { value: "attic-restoration", label: "Attic Clean-Out / Sanitize / Exclusion" },
    ],
  },
  {
    group: "Mosquito / Tick / Outdoor",
    items: [
      { value: "mosquito-barrier", label: "Mosquito Barrier Program" },
      { value: "tick-yard", label: "Tick Yard Treatment" },
      { value: "gnats-nuisance", label: "Gnats / Midges (outdoor nuisance)" },
    ],
  },
  {
    group: "Specialty / Add-Ons",
    items: [
      { value: "crawlspace", label: "Crawlspace Inspection / Treatment" },
      { value: "foundation-spray", label: "Exterior Foundation Perimeter Treatment" },
      { value: "garage-treatment", label: "Garage Treatment" },
      { value: "shed-outbuilding", label: "Shed / Outbuilding Treatment" },
      { value: "follow-up", label: "Follow-Up Service (warranty/guarantee)" },
    ],
  },
];

/** ──────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────── */
export default function BookingClient() {
  /** form state */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<string>(todayISO());
  const [service, setService] = useState<string>("general-residential");
  const [plan, setPlan] = useState<string>("Initial Service");
  const [notes, setNotes] = useState<string>("");

  /** availability & appointments */
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string>("");

  /** load customers once */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchJson<{ ok: boolean; data: Customer[] }>(
          "/api/customers?limit=50"
        );
        if (r.ok && r.data?.length) {
          setCustomers(r.data);
          setCustomerId(r.data[0].id);
        }
      } catch {
        // ignore for local mock
      }
    })();
  }, []);

  /** load availability when date changes */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchJson<{ ok: boolean; data: AvailabilitySlot[] }>(
          `/api/availability?date=${encodeURIComponent(date)}`
        );
        if (r.ok) setSlots(r.data || []);
      } catch {
        setSlots([]);
      }
    })();
  }, [date]);

  /** load appointments list */
  const loadAppointments = async () => {
    try {
      const r = await fetchJson<{ ok: boolean; data: Appointment[] }>(
        "/api/appointments"
      );
      if (r.ok) setAppts(r.data || []);
    } catch {
      setAppts([]);
    }
  };
  useEffect(() => {
    loadAppointments();
  }, []);

  /** book handler */
  const book = async (t: string) => {
    setMessage("");
    if (!customerId) {
      setMessage("Please pick a customer first.");
      return;
    }
    try {
      const r = await fetchJson<Appointment | { ok: boolean; error?: string }>(
        "/api/appointments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            date,
            time: t,
            service,
            plan,
            notes,
          }),
        }
      );

      // Our API returns { ok:true, ...apt } on success.
      const ok = (r as any).ok === true;
      if (!ok) {
        const msg = (r as any).error || "Unable to book";
        setMessage(msg);
        return;
      }

      const apt = r as any as Appointment;
      setMessage(
        `Booked ${apt.id} for ${apt.date} at ${apt.time}${plan ? ` (${plan})` : ""}.`
      );
      setNotes("");
      await loadAppointments();
    } catch (e: any) {
      setMessage(String(e?.message || e));
    }
  };

  /** cancel handler */
  const cancel = async (id: string) => {
    try {
      const r = await fetchJson<{ ok: boolean; deleted?: any; error?: string }>(
        `/api/appointments?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        setMessage(r.error || "Unable to cancel.");
        return;
      }
      await loadAppointments();
    } catch (e: any) {
      setMessage(String(e?.message || e));
    }
  };

  const serviceOptions = useMemo(() => SERVICES, []);

  return (
    <div className="container" style={{ maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ margin: "24px 0 16px" }}>Plank Scheduler — Booking</h2>

      {message && (
        <p style={{ color: message.startsWith("Booked") ? "green" : "crimson" }}>
          {message}
        </p>
      )}

      {/* Customer */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Customer
        </label>
        <select
          value={customerId ?? ""}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          style={{ width: "100%", padding: 8 }}
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.accountNo ? ` — ${c.accountNo}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div style={{ margin: "8px 0" }}>
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

      {/* Plan */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Service */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Service
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        >
          {serviceOptions.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, pet info, special instructions…"
          rows={4}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      {/* Availability check (optional) */}
      <div style={{ margin: "12px 0" }}>
        <button
          onClick={async () => {
            try {
              const r = await fetchJson<{ ok: boolean; data: AvailabilitySlot[] }>(
                `/api/availability?date=${encodeURIComponent(date)}`
              );
              if (r.ok) setSlots(r.data || []);
            } catch {
              setSlots([]);
            }
          }}
          style={{ width: "100%", padding: 10 }}
        >
          Check availability
        </button>
      </div>

      {/* Available times */}
      <div style={{ margin: "16px 0" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Available times</div>
        {slots.length === 0 ? (
          <div>No open times for selected date.</div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {slots.map((s) => (
              <button
                key={s.time}
                onClick={() => book(s.time)}
                style={{ padding: "8px 14px", borderRadius: 6 }}
                title={`Book ${s.time}`}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Booked appointments list */}
      <hr style={{ margin: "24px 0" }} />
      <h3>Booked Appointments</h3>
      <div style={{ marginBottom: 12 }}>
        <button onClick={loadAppointments}>Reload</button>
      </div>
      {appts.length === 0 ? (
        <div>No bookings yet.</div>
      ) : (
        <ul style={{ listStyle: "disc", paddingLeft: 20 }}>
          {appts.map((a) => (
            <li key={a.id} style={{ marginBottom: 14 }}>
              <div>
                <strong>
                  {a.date} at {a.time}
                </strong>
                {a.plan ? ` • ${a.plan}` : ""} {a.service ? ` • ${a.service}` : ""}
              </div>
              <div>Customer ID: {a.customerId}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {a.id} • created {new Date(a.createdAt).toLocaleString()}
              </div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => cancel(a.id)}>Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 28, fontSize: 12, color: "#666" }}>
        Serving South Central Missouri • Plank Termite & Pest Control LLC
      </div>
    </div>
  );
}
