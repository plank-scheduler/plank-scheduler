/** Global booking config */

export const BRAND = "Plank Termite & Pest Control LLC";
export const GREETING =
  "Thank you for choosing Plank Termite & Pest Control. We are a locally family-owned team serving South Central Missouri. Honest pricing, reliable service, guaranteed results.";

export type Option = { value: string; label: string };

/** Mode: "public" requires name/phone/address; "admin" shows customer dropdown */
export const BOOKING_MODE: "public" | "admin" = "public";

/** Visit/Service plans */
export const PLAN_OPTIONS: Option[] = [
  { value: "initial",    label: "Initial" },
  { value: "monthly",    label: "Monthly" },
  { value: "bi-annual",  label: "Bi-Annual" },
  { value: "quarterly",  label: "Quarterly" },
  { value: "tri-annual", label: "Tri-Annual" },
  { value: "annual",     label: "Annual" },
  { value: "one-time",   label: "One-Time" },
];

/**
 * Services grouped for the booking dropdown.
 * - Cockroaches: new dedicated group
 * - Vole Removal: moved under Rodents
 * - REMOVED: Bat removal, Attic remediation/sanitation, Wildlife exclusion
 */

export const SERVICE_GROUPS = [
  { group: "Ants", options: [
      { value: "carpenter-ants", label: "Carpenter Ants" },
      { value: "nuisance-ants",  label: "Nuisance Ants" },
      { value: "pavement-ants",  label: "Pavement Ants" },
      { value: "pharaoh-ants",   label: "Pharaoh Ants" }
  ]},
  { group: "Bed Bugs", options: [
      { value: "bed-bugs", label: "Bed Bugs" }
  ]},
  { group: "Biting/External Parasites", options: [
      { value: "chiggers",   label: "Chiggers" },
      { value: "fleas",      label: "Fleas" },
      { value: "mosquitoes", label: "Mosquitoes" },
      { value: "ticks",      label: "Ticks" }
  ]},
  { group: "Cockroaches", options: [
      { value: "american-cockroach",      label: "American Cockroach" },
      { value: "brown-banded-cockroach",  label: "Brown-Banded Cockroach" },
      { value: "german-cockroach",        label: "German Cockroach" },
      { value: "oriental-cockroach",      label: "Oriental Cockroach" },
      { value: "smokybrown-cockroach",    label: "Smokybrown Cockroach" }
  ]},
  { group: "Flies & Gnats", options: [
      { value: "cluster-fly", label: "Cluster Fly" },
      { value: "drain-fly",   label: "Drain Fly" },
      { value: "fruit-fly",   label: "Fruit Fly" },
      { value: "fungus-gnats",label: "Fungus Gnats" },
      { value: "house-fly",   label: "House Fly" }
  ]},
  { group: "Occasional Invaders", options: [
      { value: "asian-lady-beetles", label: "Asian Lady Beetles" },
      { value: "boxelder-bugs",      label: "Boxelder Bugs" },
      { value: "centipedes",         label: "Centipedes" },
      { value: "crickets-camel-cave",label: "Crickets (Camel/Cave)" },
      { value: "earwigs",            label: "Earwigs" },
      { value: "millipedes",         label: "Millipedes" },
      { value: "silverfish",         label: "Silverfish" },
      { value: "springtails",        label: "Springtails" },
      { value: "stink-bugs",         label: "Stink Bugs" }
  ]},
  { group: "Other", options: [
      { value: "other", label: "Other (Describe)" }
  ]},
  { group: "Pantry Pests", options: [
      { value: "flour-beetles",          label: "Flour Beetles" },
      { value: "indianmeal-moth",        label: "Indianmeal Moth" },
      { value: "sawtoothed-grain-beetle",label: "Sawtoothed Grain Beetle" }
  ]},
  { group: "Rodents", options: [
      { value: "mice",  label: "Mice"  },
      { value: "rats",  label: "Rats"  },
      { value: "voles", label: "Voles" }
  ]},
  { group: "Spiders", options: [
      { value: "black-widow",          label: "Black Widow" },
      { value: "brown-recluse",        label: "Brown Recluse" },
      { value: "common-house-spider",  label: "Common House Spider" },
      { value: "wolf-spider",          label: "Wolf Spider" }
  ]},
  { group: "Stinging Pests", options: [
      { value: "bald-faced-hornets", label: "Bald-Faced Hornets" },
      { value: "bees",               label: "Bees" },
      { value: "cicada-killers",     label: "Cicada Killers" },
      { value: "paper-wasps",        label: "Paper Wasps" },
      { value: "yellowjackets",      label: "Yellowjackets" }
  ]},
  { group: "Termites & WDI", options: [
      { value: "carpenter-bees",                    label: "Carpenter Bees" },
      { value: "powder-post-beetles",              label: "Powder Post Beetles" },
      { value: "sentricon-1-termite-elimination-system", label: "Sentricon #1 Termite Elimination System" },
      { value: "sentricon-check",                  label: "Sentricon Check" },
      { value: "subterranean-termites",            label: "Subterranean Termites" },
      { value: "termite-wdi-inspection-reports",   label: "Termite (WDI) Inspection Reports" }
  ]},
  { group: "Wildlife", options: [
      { value: "birds",     label: "Birds" },
      { value: "groundhogs",label: "Groundhogs" },
      { value: "opossums",  label: "Opossums" },
      { value: "raccoons",  label: "Raccoons" },
      { value: "skunks",    label: "Skunks" },
      { value: "snakes",    label: "Snakes" },
      { value: "squirrels", label: "Squirrels" }
  ]},
  { group: "Yard Treatments", options: [
      { value: "yard-chiggers",      label: "Chiggers" },
      { value: "yard-fleas",         label: "Fleas" },
      { value: "yard-general-pests", label: "General Pests" },
      { value: "yard-mosquitos",     label: "Mosquitos" },
      { value: "yard-ticks",         label: "Ticks" }
        ],
    },
      {
    group: "Insulation",
    options: [
      { value: "top-off-insulation", label: "Top Off Existing Insulation" },
      { value: "remove-replace-insulation", label: "Remove and Replace Insulation" },
      { value: "rodent-contaminated-insulation", label: "Rodent-Contaminated Insulation Removal" },
      { value: "new-blown-in-insulation", label: "New Blown-In Insulation" },
      { value: "insulation-inspection", label: "Insulation Inspection / Quote" },
    ],
  },
  {
    group: "Lawn Care",
    options: [
      { value: "lawn-mowing", label: "Lawn Mowing" },
      { value: "fertilization-weed-control", label: "Fertilization & Weed Control" },
      { value: "aeration-overseeding", label: "Aeration & Overseeding" },
      { value: "mulching", label: "Mulching" },
      { value: "yard-clean-up", label: "Yard Clean-Up" },
      { value: "shrub-bush-trimming", label: "Shrub & Bush Trimming" },
      { value: "leaf-removal", label: "Leaf Removal" },
      { value: "seasonal-lawn-care", label: "Seasonal Lawn Care Programs" },
      { value: "other-lawn-care", label: "Other Lawn Care Service" },
    ],
  },
  {
    group: "Holiday / Seasonal Lighting",
    options: [
      { value: "govee-permanent", label: "Govee Permanent Outdoor Lights" },
      { value: "christmas-install", label: "Christmas Light Installation" },
      { value: "roofline-lighting", label: "Roofline Holiday Lighting" },
      { value: "tree-shrub-lighting", label: "Tree & Shrub Lighting" },
      { value: "wreath-garland-entry", label: "Wreaths / Garland / Entryway" },
      { value: "commercial-holiday", label: "Commercial Holiday Lighting" },
      { value: "holiday-removal", label: "Holiday Light Removal" },
      { value: "holiday-repair", label: "Holiday Light Repair / Troubleshooting" },
      { value: "other-holiday", label: "Other Holiday / Seasonal Lighting" },
    ],
  },
];
  
export const COMPANY_NAME = BRAND;

