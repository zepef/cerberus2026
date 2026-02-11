export interface EUCountry {
  name: string;
  isoA2: string; // Eurostat uses EL for Greece, not GR
}

// All 27 EU member states — slug → display name + ISO A2 (Eurostat convention)
export const EU_COUNTRIES: Record<string, EUCountry> = {
  austria: { name: "Austria", isoA2: "AT" },
  belgium: { name: "Belgium", isoA2: "BE" },
  bulgaria: { name: "Bulgaria", isoA2: "BG" },
  croatia: { name: "Croatia", isoA2: "HR" },
  cyprus: { name: "Cyprus", isoA2: "CY" },
  czechia: { name: "Czechia", isoA2: "CZ" },
  denmark: { name: "Denmark", isoA2: "DK" },
  estonia: { name: "Estonia", isoA2: "EE" },
  finland: { name: "Finland", isoA2: "FI" },
  france: { name: "France", isoA2: "FR" },
  germany: { name: "Germany", isoA2: "DE" },
  greece: { name: "Greece", isoA2: "EL" }, // Eurostat uses EL, not GR
  hungary: { name: "Hungary", isoA2: "HU" },
  ireland: { name: "Ireland", isoA2: "IE" },
  italy: { name: "Italy", isoA2: "IT" },
  latvia: { name: "Latvia", isoA2: "LV" },
  lithuania: { name: "Lithuania", isoA2: "LT" },
  luxembourg: { name: "Luxembourg", isoA2: "LU" },
  malta: { name: "Malta", isoA2: "MT" },
  netherlands: { name: "Netherlands", isoA2: "NL" },
  poland: { name: "Poland", isoA2: "PL" },
  portugal: { name: "Portugal", isoA2: "PT" },
  romania: { name: "Romania", isoA2: "RO" },
  slovakia: { name: "Slovakia", isoA2: "SK" },
  slovenia: { name: "Slovenia", isoA2: "SI" },
  spain: { name: "Spain", isoA2: "ES" },
  sweden: { name: "Sweden", isoA2: "SE" },
};

// Reverse lookup: ISO A2 → slug
export const ISO_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(EU_COUNTRIES).map(([slug, { isoA2 }]) => [isoA2, slug])
);

// Set of all EU ISO codes for filtering TopoJSON
export const EU_ISO_CODES = new Set(
  Object.values(EU_COUNTRIES).map((c) => c.isoA2)
);
