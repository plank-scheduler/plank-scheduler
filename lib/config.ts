// lib/config.ts
export const BRAND = "Plank Termite & Pest Control LLC";
export const GREETING =
  "Thank you for choosing Plank Termite & Pest Control. We are a locally family-owned team serving South Central Missouri. Honest pricing, reliable service, guaranteed results.";

export type Option = { value: string; label: string };

export const PLAN_OPTIONS: Option[] = [
  { value: "", label: "— Select a plan —" }, // forces user to choose
  { value: "initial", label: "Initial Service" },
  { value: "one-time", label: "One-Time Service" },
  { value: "quarterly", label: "Quarterly" },
  { value: "tri-annual", label: "Tri-Annual" },
  { value: "bi-monthly", label: "Bi-Monthly" },
  { value: "monthly", label: "Monthly" },

  // Termite / wood-destroying programs
  { value: "termite-treatment", label: "Termite Treatment" },
  { value: "termite-inspection", label: "Termite Inspection (WDI/WDO)" },
  { value: "sentricon-install", label: "Sentricon Install" },
  { value: "sentricon-service", label: "Sentricon Service" },
  { value: "sentricon-check", label: "Sentricon Check" }, // you asked to include this
];

// (Your SERVICE_OPTIONS stays as-is with the full Missouri list, including Mosquito)

