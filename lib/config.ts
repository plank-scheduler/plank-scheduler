// lib/config.ts
export const BRAND = "Plank Termite & Pest Control LLC";

export const GREETING =
  "Thank you for choosing Plank Termite & Pest Control. We are a locally family-owned team serving South Central Missouri. Honest pricing, reliable service, guaranteed results.";

// Generic option type
export type Option = { value: string; label: string };

// Service Plans (separate from specific services)
export const PLAN_OPTIONS: Option[] = [
  { value: "initial", label: "Initial Service" },
  { value: "quarterly", label: "Quarterly" },
  { value: "tri-annual", label: "Tri-Annual" },
  { value: "bi-monthly", label: "Bi-Monthly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "one-time", label: "One-Time" },
];

// Missouri-focused service catalog
export const SERVICE_OPTIONS: Option[] = [
  // General Pests
  { value: "general", label: "General" },
  { value: "ants", label: "Ants" },
  { value: "roaches", label: "Cockroaches" },
  { value: "spiders", label: "Spiders" },
  { value: "fleas-ticks", label: "Fleas / Ticks" },
  { value: "wasps-hornets", label: "Wasps / Hornets" },
  { value: "mosquito", label: "Mosquito Reduction" },
  { value: "bed-bugs", label: "Bed Bugs" },

  // Rodents
  { value: "mice-rats", label: "Rodents (Mice / Rats)" },

  // Wildlife
  { value: "raccoon", label: "Raccoon Removal" },
  { value: "squirrel", label: "Squirrel Removal" },
  { value: "bat", label: "Bat Exclusion" },
  { value: "bird", label: "Bird Exclusion" },
  { value: "vole-gopher", label: "Vole / Gopher Yard Program" },

  // Termites
  { value: "termites-inspection", label: "Termite Inspection" },
  { value: "termites-treatment", label: "Termite Treatment" },
  { value: "termites-bond", label: "Termite Warranty / Bond" },
];

