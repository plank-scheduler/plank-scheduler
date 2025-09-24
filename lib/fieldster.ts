// lib/fieldster.ts
export type Customer = {
  id: number;
  customer_number: string;
  customer_name: string;
  city?: string;
  state?: string;
  primary_phone?: string;
  primary_email?: string;
};

export type AppointmentCreateInput = {
  customerId: number;
  date: string;    // YYYY-MM-DD
  time: string;    // HH:mm
  serviceType?: string;
  notes?: string;
};

export type AppointmentCreateResponse = { id: string };
export type AvailabilityResponse = { slots: string[] };

const USE_MOCK = process.env.USE_FIELDSTER_MOCK === "1";
const BASE_URL = process.env.FIELDSTER_BASE_URL ?? "";
const API_KEY  = process.env.FIELDSTER_API_KEY ?? "";

const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, customer_number: "137-00010001", customer_name: "Mickey Mouse", city: "Birmingham", state: "AL", primary_phone: "(573) 453-6553", primary_email: "mickey@example.com" },
  { id: 2, customer_number: "137-00010002", customer_name: "Minnie Mouse",  city: "Birmingham", state: "AL" }
];
const MOCK_SLOTS = ["09:00", "10:30", "13:00", "15:30"];

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Mock short-circuits
  if (USE_MOCK) {
    if (path.startsWith("/customers")) {
      return { data: MOCK_CUSTOMERS } as unknown as T;
    }
    if (path.startsWith("/availability")) {
      return { slots: MOCK_SLOTS } as unknown as T;
    }
    if (path.startsWith("/appointments") && (init.method ?? "GET") === "POST") {
      return { id: `apt_${Date.now()}` } as unknown as T;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      ...(init.headers ?? {}),
    },
    body: init.body,
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Fieldster error ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export const fieldster = {
  async customers({ limit = 10 } = {}): Promise<Customer[]> {
    const out = await http<{ data: Customer[] }>(`/customers?limit=${limit}`);
    return out.data;
  },

  async availability(date: string): Promise<string[]> {
    const out = await http<AvailabilityResponse>(`/availability?date=${encodeURIComponent(date)}`);
    return out.slots ?? [];
  },

  async createAppointment(input: AppointmentCreateInput): Promise<AppointmentCreateResponse> {
    return http<AppointmentCreateResponse>(`/appointments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  health() {
    return {
      useMock: USE_MOCK,
      hasBaseUrl: Boolean(BASE_URL),
      hasApiKey: Boolean(API_KEY),
    };
  },
};

