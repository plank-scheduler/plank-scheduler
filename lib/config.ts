// lib/config.ts

export const BRAND = "Plank Termite & Pest Control LLC";

export const GREETING =
  "Thank you for choosing Plank Termite & Pest Control. We are a locally family-owned team serving South Central Missouri. Honest pricing, reliable service, guaranteed results.";

export type PlanOption = { id: string; label: string };
export type ServiceOption = { id: string; label: string };

// Visit/Service Plan options (scheduling cadence)
export const PLANS: PlanOption[] = [
  { id: "initial", label: "Initial Service" },
  { id: "monthly", label: "Monthly" },
  { id: "bi-monthly", label: "Bi-Monthly (every 2 months)" },
  { id: "quarterly", label: "Quarterly" },
  { id: "tri-annual", label: "Tri-Annual" },
  { id: "bi-annual", label: "Bi-Annual" },
  { id: "one-time", label: "One-Time" },
];

// Missouri-focused pest/wildlife/termite services
// (You asked to remove “Mole” and keep “Vole / Gopher Yard Program”)
export const SERVICES: ServiceOption[] = [
  // General pest
  { id: "general", label: "General" },
  { id: "ants", label: "Ants" },
  { id: "carpenter-ants", label: "Carpenter Ants" },
  { id: "spiders", label: "Spiders (incl. Brown Recluse options)" },
  { id: "roaches", label: "Roaches (German/American/Oriental)" },
  { id: "fleas-ticks", label: "Fleas & Ticks" },
  { id: "mosquitoes", label: "Mosquitoes" },
  { id: "stinging", label: "Wasps / Hornets / Yellow Jackets" },
  { id: "stink-bugs", label: "Stink Bugs" },
  { id: "carpenter-bees", label: "Carpenter Bees" },
  { id: "silverfish", label: "Silverfish / Firebrats" },
  { id: "pantry-pests", label: "Pantry Pests (Moths/Beetles/Weevils)" },

  // Rodents
  { id: "mice-rats", label: "Mice / Rats (Interior & Exterior)" },

  // Bed bugs
  { id: "bed-bugs", label: "Bed Bugs (Inspection & Treatment)" },

  // Termites
  { id: "termite-inspection", label: "Termite Inspection" },
  { id: "termite-liquid", label: "Termite Liquid Trench & Treat" },
  { id: "termite-bait", label: "Termite Bait Station Program" },
  { id: "wdo-letter", label: "Real-Estate WDO / Termite Letter" },

  // Wildlife (trap/exclude)
  { id: "bats", label: "Bats (Inspection / Exclusion)" },
  { id: "raccoon", label: "Raccoon" },
  { id: "opossum", label: "Opossum" },
  { id: "skunk", label: "Skunk" },
  { id: "squirrel", label: "Squirrel" },
  { id: "snake", label: "Snake" },
  { id: "bird", label: "Bird (Nesting / Exclusion)" },

  // Yard program (no moles, by request)
  { id: "vole-gopher", label: "Vole / Gopher Yard Program" },
];
