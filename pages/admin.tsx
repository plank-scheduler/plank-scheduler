import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  createdAt?: string;
  date?: string;
  time?: string;
  plan?: string;
  service?: string;
  insulationService?: string;
  lawnCare?: string;
  holidayLighting?: string;
  notes?: string;
  officeNotes?: string;
  status?: string;
  statusUpdatedAt?: string;
  archived?: boolean;
  archivedAt?: string | null;
  photoUrls?: string[];

  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    email?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

type ApiResp = {
  ok?: boolean;
  success?: boolean;
  count?: number;
  data?: Appointment[];
  appointments?: Appointment[];
  error?: string;
};

const STATUSES = ["New", "Contacted", "Scheduled", "Completed", "Cancelled"];

function label(value?: string) {
  if (!value) return "None selected";
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function prettyDate(date?: string) {
  if (!date) return "N/A";
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  return `${m}/${d}/${y}`;
}

function getStatus(appt: Appointment) {
  return appt.status || "New";
}

function isArchived(appt: Appointment) {
  return (
    appt.archived === true ||
    String(appt.status || "").toLowerCase() === "archived"
  );
}

function normalizePhone(phone?: string) {
  return String(phone || "").replace(/\D/g, "");
}

function csvSafe(value: any) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function statusColor(status: string) {
  if (status === "New") return "#1f7a34";
  if (status === "Contacted") return "#0b5ed7";
  if (status === "Scheduled") return "#6f42c1";
  if (status === "Completed") return "#555";
  if (status === "Cancelled") return "#b00020";
  if (status === "Archived") return "#777";
  return "#333";
}

function serviceColor(appt: Appointment) {
  if (appt.service) return "#d93025";
  if (appt.insulationService) return "#f59e0b";
  if (appt.lawnCare) return "#1f7a34";
  if (appt.holidayLighting) return "#0b5ed7";
  return "#555";
}

function priorityInfo(appt: Appointment) {
  const combined = [
    appt.service,
    appt.insulationService,
    appt.lawnCare,
    appt.holidayLighting,
    appt.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    combined.includes("termite") ||
    combined.includes("bed-bugs") ||
    combined.includes("bed bugs") ||
    combined.includes("german-cockroach") ||
    combined.includes("german cockroach")
  ) {
    return { label: "High Priority", color: "#b00020" };
  }

  if (
    combined.includes("rodent") ||
    combined.includes("wasp") ||
    combined.includes("fleas") ||
    combined.includes("flea")
  ) {
    return { label: "Medium Priority", color: "#c77700" };
  }

  return { label: "Normal", color: "#555" };
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("");

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [archiveFilter, setArchiveFilter] = useState("Active");

  async function loadAppointments(pass: string, keepUnlocked = false) {
    setLoading(true);
    setError("");

    try {
      const r = await fetch("/api/admin-appointments", {
        headers: {
          "x-admin-password": pass,
        },
      });

      const j: ApiResp = await r.json();
      const isOk = j.ok === true || j.success === true;

      if (!isOk) {
        throw new Error(j.error || "Could not load appointments");
      }

      const incoming = j.data || j.appointments || [];

      setAppointments(incoming);
      setUnlocked(true);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(String(err?.message || err));

      if (!keepUnlocked) {
        setUnlocked(false);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!unlocked || !password) return;

    const timer = window.setInterval(() => {
      loadAppointments(password, true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [unlocked, password]);

  async function updateAppointment(
    id: string,
    updates: Partial<Appointment> & { deleted?: boolean }
  ) {
    try {
      const r = await fetch("/api/update-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      const j = await r.json();

      if (!j.ok) {
        throw new Error(j.error || "Could not update request");
      }

      if (updates.deleted) {
        setAppointments((current) => current.filter((appt) => appt.id !== id));
        return;
      }

      setAppointments((current) =>
        current.map((appt) =>
          appt.id === id ? { ...appt, ...j.appointment } : appt
        )
      );
    } catch (err: any) {
      alert(String(err?.message || err));
    }
  }

  const duplicateMap = useMemo(() => {
    const map: Record<string, number> = {};

    appointments.forEach((appt) => {
      const email = String(appt.customer?.email || "").trim().toLowerCase();
      const phone = normalizePhone(appt.customer?.phone);
      const key = email || phone;

      if (!key) return;

      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [appointments]);

  function isDuplicate(appt: Appointment) {
    const email = String(appt.customer?.email || "").trim().toLowerCase();
    const phone = normalizePhone(appt.customer?.phone);
    const key = email || phone;

    if (!key) return false;

    return duplicateMap[key] > 1;
  }

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return appointments.filter((appt) => {
      const archived = isArchived(appt);

      const combined = [
        appt.customer?.name,
        appt.customer?.phone,
        appt.customer?.email,
        appt.customer?.address,
        appt.date,
        appt.time,
        appt.plan,
        appt.service,
        appt.insulationService,
        appt.lawnCare,
        appt.holidayLighting,
        appt.notes,
        appt.officeNotes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || combined.includes(q);

      const matchesStatus =
        statusFilter === "All" || getStatus(appt) === statusFilter;

      const matchesService =
        serviceFilter === "All" ||
        (serviceFilter === "Pest Control" && !!appt.service) ||
        (serviceFilter === "Insulation" && !!appt.insulationService) ||
        (serviceFilter === "Lawn Care" && !!appt.lawnCare) ||
        (serviceFilter === "Holiday Lighting" && !!appt.holidayLighting);

      const matchesArchive =
        archiveFilter === "All" ||
        (archiveFilter === "Active" && !archived) ||
        (archiveFilter === "Archived" && archived);

      return matchesSearch && matchesStatus && matchesService && matchesArchive;
    });
  }, [appointments, search, statusFilter, serviceFilter, archiveFilter]);

  function exportCsv() {
    const rows = filteredAppointments.map((appt) => [
      appt.id,
      appt.createdAt || "",
      getStatus(appt),
      isArchived(appt) ? "Archived" : "Active",
      priorityInfo(appt).label,
      isDuplicate(appt) ? "Possible Duplicate" : "",
      appt.customer?.name || "",
      appt.customer?.phone || "",
      appt.customer?.email || "",
      appt.customer?.address || "",
      appt.date || "",
      appt.time || "",
      label(appt.plan),
      label(appt.service),
      label(appt.insulationService),
      label(appt.lawnCare),
      label(appt.holidayLighting),
      appt.notes || "",
      appt.officeNotes || "",
      (appt.photoUrls || []).join(" | "),
    ]);

    const header = [
      "ID",
      "Created",
      "Status",
      "Archive",
      "Priority",
      "Duplicate",
      "Name",
      "Phone",
      "Email",
      "Address",
      "Date",
      "Time",
      "Plan",
      "Pest Control",
      "Insulation",
      "Lawn Care",
      "Holiday Lighting",
      "Customer Notes",
      "Office Notes",
      "Photos",
    ];

    const csv = [header, ...rows]
      .map((row) => row.map(csvSafe).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "plank-booking-requests.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <main
        style={{
          maxWidth: 420,
          margin: "100px auto",
          padding: 24,
          fontFamily: "Arial, sans-serif",
          border: "1px solid #ddd",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ color: "#1f7a34" }}>Admin Login</h1>

        <p>Enter the admin password to view booking requests.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          onKeyDown={(e) => {
            if (e.key === "Enter") loadAppointments(password);
          }}
          style={{
            width: "100%",
            padding: 10,
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        />

        <button
          type="button"
          onClick={() => loadAppointments(password)}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {error ? (
          <p style={{ color: "crimson", fontWeight: 700 }}>{error}</p>
        ) : null}
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 10, color: "#1f7a34" }}>
        Plank Pest Control — Booking Dashboard
      </h1>

      <p style={{ marginBottom: 20 }}>
        Showing <strong>{filteredAppointments.length}</strong> of{" "}
        <strong>{appointments.length}</strong> requests
        {lastRefreshed ? (
          <span style={{ marginLeft: 12, color: "#666" }}>
            Last refreshed: {lastRefreshed}
          </span>
        ) : null}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr auto auto",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, service, date, notes..."
          style={{ padding: 10, width: "100%", boxSizing: "border-box" }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 10, width: "100%", boxSizing: "border-box" }}
        >
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          style={{ padding: 10, width: "100%", boxSizing: "border-box" }}
        >
          <option value="All">All Services</option>
          <option value="Pest Control">Pest Control</option>
          <option value="Insulation">Insulation</option>
          <option value="Lawn Care">Lawn Care</option>
          <option value="Holiday Lighting">Holiday Lighting</option>
        </select>

        <select
          value={archiveFilter}
          onChange={(e) => setArchiveFilter(e.target.value)}
          style={{ padding: 10, width: "100%", boxSizing: "border-box" }}
        >
          <option value="Active">Active Only</option>
          <option value="Archived">Archived Only</option>
          <option value="All">All Requests</option>
        </select>

        <button
          type="button"
          onClick={() => loadAppointments(password, true)}
          style={{
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={exportCsv}
          style={{
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {filteredAppointments.map((appt) => {
          const status = getStatus(appt);
          const priority = priorityInfo(appt);
          const duplicate = isDuplicate(appt);
          const archived = isArchived(appt);
          const photos = Array.isArray(appt.photoUrls) ? appt.photoUrls : [];

          return (
            <div
              key={appt.id}
              style={{
                border: "1px solid #ccc",
                borderLeft: `8px solid ${serviceColor(appt)}`,
                borderRadius: 10,
                padding: 20,
                background: archived ? "#f3f3f3" : "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                opacity: archived ? 0.75 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {appt.customer?.name || "Unknown Customer"}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: priority.color,
                        color: "#fff",
                        fontWeight: 700,
                        marginRight: 8,
                      }}
                    >
                      {priority.label}
                    </span>

                    {duplicate ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#b00020",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Possible Duplicate
                      </span>
                    ) : null}

                    {archived ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#777",
                          color: "#fff",
                          fontWeight: 700,
                          marginLeft: 8,
                        }}
                      >
                        Archived
                      </span>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    📞{" "}
                    {appt.customer?.phone ? (
                      <a href={`tel:${appt.customer.phone}`}>
                        {appt.customer.phone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    ✉️{" "}
                    {appt.customer?.email ? (
                      <a href={`mailto:${appt.customer.email}`}>
                        {appt.customer.email}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    📍 {appt.customer?.address || "No address"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: statusColor(status),
                      color: "#fff",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {status}
                  </div>

                  <div>
                    <strong>Date:</strong> {prettyDate(appt.date)}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <strong>Time:</strong> {appt.time || "N/A"}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <strong>Plan:</strong> {label(appt.plan)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 700, marginRight: 8 }}>
                  Status:
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    updateAppointment(appt.id, { status: e.target.value })
                  }
                  style={{ padding: 8 }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    updateAppointment(appt.id, { archived: !archived })
                  }
                  style={{
                    marginLeft: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  {archived ? "Unarchive" : "Archive"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      "Delete this request permanently? This cannot be undone."
                    );

                    if (ok) updateAppointment(appt.id, { deleted: true });
                  }}
                  style={{
                    marginLeft: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                    color: "#b00020",
                    fontWeight: 700,
                  }}
                >
                  Delete
                </button>
              </div>

              <hr style={{ margin: "16px 0" }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <strong>Pest Control:</strong>
                  <div>{label(appt.service)}</div>
                </div>

                <div>
                  <strong>Insulation:</strong>
                  <div>{label(appt.insulationService)}</div>
                </div>

                <div>
                  <strong>Lawn Care:</strong>
                  <div>{label(appt.lawnCare)}</div>
                </div>

                <div>
                  <strong>Holiday Lighting:</strong>
                  <div>{label(appt.holidayLighting)}</div>
                </div>
              </div>

              {photos.length > 0 ? (
                <div style={{ marginTop: 18 }}>
                  <strong>Customer Photos:</strong>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 10,
                    }}
                  >
                    {photos.map((photo, index) => (
                      <a
                        key={`${photo}-${index}`}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          width: 150,
                          textDecoration: "none",
                          color: "#333",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#fafafa",
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Customer uploaded photo ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        <div
                          style={{
                            padding: 6,
                            fontSize: 12,
                            textAlign: "center",
                          }}
                        >
                          View Photo {index + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 18 }}>
                <strong>Customer Notes:</strong>

                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    background: "#f7f7f7",
                    borderRadius: 6,
                    minHeight: 40,
                  }}
                >
                  {appt.notes || "No customer notes"}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <strong>Office Notes:</strong>

                <textarea
                  value={appt.officeNotes || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    setAppointments((current) =>
                      current.map((item) =>
                        item.id === appt.id
                          ? { ...item, officeNotes: value }
                          : item
                      )
                    );
                  }}
                  placeholder="Add internal notes here..."
                  rows={3}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: 10,
                    boxSizing: "border-box",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    updateAppointment(appt.id, {
                      officeNotes: appt.officeNotes || "",
                    })
                  }
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Office Notes
                </button>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, color: "#666" }}>
                Created: {String(appt.createdAt || "Unknown")}
                {appt.statusUpdatedAt
                  ? ` • Status Updated: ${String(appt.statusUpdatedAt)}`
                  : ""}
                {appt.archivedAt
                  ? ` • Archived: ${String(appt.archivedAt)}`
                  : ""}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}