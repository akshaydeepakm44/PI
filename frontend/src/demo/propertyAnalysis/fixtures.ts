// ============================================================
// DEMO FIXTURES – Property Analysis demonstration
// NEVER import this file outside the /property-analysis route.
// All names, prices, dates, sources are entirely fictional.
// Every property and builder name ends with "(Sample)".
// Every source domain ends with ".example".
// ============================================================

export type Tier = 'Official' | 'News' | 'Portal' | 'Community' | 'Builder';
export type ClaimStatus = 'Verified' | 'Differs' | 'Not found in the sources checked';
export type AnnouncementStatus = 'Announced' | 'Approved' | 'Tender' | 'Under construction' | 'Land acquisition';
export type CoverageLevel = 'High' | 'Medium' | 'Low';

export interface CrossPortalRow {
  source: string;
  tier: Tier;
  price: number;        // rupees
  areaSqft: number;
  possession: string;
  date: string;
}

export interface BuilderProject {
  name: string;
  promised: string;    // e.g. "Mar 2019"
  reported: string | null;  // null if under construction
  slipMonths: number | null;
  status: 'completed' | 'under construction';
}

export interface RegistrationClaim {
  claim: string;
  listingValue: string;
  recordValue: string;
  status: ClaimStatus;
  source: string;
}

export interface Announcement {
  title: string;
  date: string;
  status: AnnouncementStatus;
  distanceKm: number;
  source: string;
}

export interface VoiceTopic {
  topic: string;
  mentions: number;
}

export interface ListingHistory {
  firstSeen: string;
  priceChanges: number;
  startPrice: number;    // rupees
  currentPrice: number;  // rupees
  mediaReuse: { photos: number; reused: number };
}

export interface DemoSource {
  title: string;
  domain: string;        // must end with .example
  date: string;
  tier: Tier;
}

export interface PropertyAnalysisFixture {
  id: 'sample-a' | 'sample-b' | 'sample-c';
  label: string;
  property: { name: string; builder: string; locality: string; city: string };
  coverage: { pages: number; searches: number; notFound: number; level: CoverageLevel; reason: string };
  crossPortal: { rows: CrossPortalRow[]; note: string; headline: string };
  builderRecord: { projects: BuilderProject[]; note: string; headline: string };
  registration: { claims: RegistrationClaim[]; headline: string };
  announcements: { items: Announcement[]; headline: string };
  voices: { n: number; from: string; to: string; topics: VoiceTopic[]; scope: string; headline: string };
  listingHistory: ListingHistory & { headline: string };
  settleFirst: { claim: string; question: string };
  checks: [string, string, string];
  sources: DemoSource[];
}

// ── Helper: compute price per sqft (rounded) ─────────────────
export function pricePerSqft(price: number, sqft: number): number {
  return Math.round(price / sqft);
}

// ── Computed values exposed for tests ────────────────────────
export function computedValues(f: PropertyAnalysisFixture) {
  const rows = f.crossPortal.rows;
  const ppsf = rows.map(r => pricePerSqft(r.price, r.areaSqft));
  const prices = rows.map(r => r.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spreadPct = Math.round(((maxPrice - minPrice) / minPrice) * 100 * 10) / 10;

  const completed = f.builderRecord.projects.filter(p => p.status === 'completed' && p.slipMonths !== null);
  const slips = completed.map(p => p.slipMonths as number);
  const withinSix = slips.filter(s => s <= 6).length;
  const sortedSlips = [...slips].sort((a, b) => a - b);
  const mid = Math.floor(sortedSlips.length / 2);
  const medianSlip = sortedSlips.length % 2 === 0
    ? (sortedSlips[mid - 1] + sortedSlips[mid]) / 2
    : sortedSlips[mid];

  const { startPrice, currentPrice } = f.listingHistory;
  const priceChangePct = Math.round(((currentPrice - startPrice) / startPrice) * 100 * 10) / 10;

  return { ppsf, priceSpreadPct: spreadPct, withinSix, medianSlip, priceChangePct };
}

// ================================================================
// SAMPLE A – Rich evidence
// ================================================================
export const SAMPLE_A: PropertyAnalysisFixture = {
  id: 'sample-a',
  label: 'Sample A: well-documented project',
  property: {
    name: 'Lakeview Residency (Sample)',
    builder: 'Northfield Builders (Sample)',
    locality: 'Sample Nagar',
    city: 'Sample City',
  },
  coverage: {
    pages: 9,
    searches: 6,
    notFound: 3,
    level: 'Medium',
    reason: 'Registration record and four listings found; two requested documents not found.',
  },
  crossPortal: {
    headline: 'Four sources give four prices, and one gives a later possession.',
    note: 'Asking prices are not sale prices. Price per sq ft and spread are calculated from the sources above.',
    rows: [
      { source: 'Homefront Portal (Sample)', tier: 'Portal', price: 10800000, areaSqft: 1240, possession: 'Dec 2027', date: 'Nov 2026' },
      { source: 'Nestlink Portal (Sample)',  tier: 'Portal', price: 11200000, areaSqft: 1240, possession: 'Dec 2027', date: 'Nov 2026' },
      { source: 'Urbanview Portal (Sample)', tier: 'Portal', price: 10500000, areaSqft: 1215, possession: 'Jun 2028', date: 'Nov 2026' },
      { source: 'Northfield Builders (Sample) Website', tier: 'Builder', price: 11000000, areaSqft: 1240, possession: 'Dec 2027', date: 'Oct 2026' },
    ],
  },
  builderRecord: {
    headline: 'Two of four completed projects were handed over within six months of the promised date.',
    note: 'Handover dates are as reported on the registration portal; they may differ from occupation certificate dates.',
    projects: [
      { name: 'Northfield Orchid (Sample)', promised: 'Mar 2019', reported: 'Mar 2019', slipMonths: 0, status: 'completed' },
      { name: 'Northfield Crest (Sample)',  promised: 'Jun 2020', reported: 'Oct 2020', slipMonths: 4, status: 'completed' },
      { name: 'Northfield Vale (Sample)',   promised: 'Dec 2021', reported: 'Sep 2022', slipMonths: 9, status: 'completed' },
      { name: 'Northfield Park (Sample)',   promised: 'Mar 2023', reported: 'May 2024', slipMonths: 14, status: 'completed' },
      { name: 'Northfield Pines (Sample)',  promised: 'Jun 2026', reported: null, slipMonths: null, status: 'under construction' },
    ],
  },
  registration: {
    headline: 'The registered completion date is three months after the listed one.',
    claims: [
      { claim: 'Registration number',  listingValue: 'SN/RERA/2024/0471', recordValue: 'SN/RERA/2024/0471', status: 'Verified',  source: 'Sample Regulator Portal (Sample)' },
      { claim: 'Possession date',       listingValue: 'Dec 2027',           recordValue: 'Mar 2028',           status: 'Differs',  source: 'Sample Regulator Portal (Sample)' },
      { claim: 'Metro within 2 km',     listingValue: 'Yes (2 km)',          recordValue: '1.4 km – planned, not operating', status: 'Differs',  source: 'Sample Metro Authority (Sample)' },
      { claim: 'Green building pre-certified', listingValue: 'Yes',         recordValue: '',                   status: 'Not found in the sources checked', source: '' },
    ],
  },
  announcements: {
    headline: 'Two nearby projects are announced; neither is under construction.',
    items: [
      { title: 'Sample Metro Line 2 extension (Sample)',  date: 'Mar 2025', status: 'Tender', distanceKm: 1.4, source: 'Sample Metro Authority (Sample)' },
      { title: 'Sample Ring Road widening (Sample)',      date: 'Aug 2025', status: 'Land acquisition', distanceKm: 0.9, source: 'Sample Roads Dept (Sample)' },
    ],
  },
  voices: {
    headline: 'Water supply is the most-mentioned topic, 11 of 38.',
    n: 38,
    from: 'Jan 2026',
    to: 'Oct 2026',
    scope: "Residents of the builder's two completed projects (Northfield Orchid (Sample), Northfield Crest (Sample)); this project is not yet built.",
    topics: [
      { topic: 'Water supply', mentions: 11 },
      { topic: 'Maintenance', mentions: 8 },
      { topic: 'Security', mentions: 7 },
      { topic: 'Lifts', mentions: 4 },
      { topic: 'Parking', mentions: 4 },
      { topic: 'Other', mentions: 4 },
    ],
  },
  listingHistory: {
    headline: 'Price rose 5.9% over 18 months; two of six photos appear on another project page.',
    firstSeen: 'Apr 2025',
    priceChanges: 3,
    startPrice: 10200000,
    currentPrice: 10800000,
    mediaReuse: { photos: 6, reused: 2 },
  },
  settleFirst: {
    claim: 'Possession date mismatch',
    question: 'Which possession date is contractual: December 2027 (listing) or March 2028 (registration record)?',
  },
  checks: [
    'Ask the builder for the registered completion date in writing.',
    'Compare the carpet area in the agreement with the 1,240 sq ft listed.',
    'Read the registration record\'s list of approvals and note any that are pending.',
  ],
  sources: [
    { title: 'Homefront Portal listing – Lakeview Residency (Sample)', domain: 'homefront.example', date: 'Nov 2026', tier: 'Portal' },
    { title: 'Nestlink Portal listing – Lakeview Residency (Sample)',  domain: 'nestlink.example',  date: 'Nov 2026', tier: 'Portal' },
    { title: 'Urbanview Portal listing – Lakeview Residency (Sample)', domain: 'urbanview.example', date: 'Nov 2026', tier: 'Portal' },
    { title: 'Northfield Builders (Sample) – project page',            domain: 'northfieldbuilders.example', date: 'Oct 2026', tier: 'Builder' },
    { title: 'Sample Regulator Portal – registration SN/RERA/2024/0471', domain: 'samplerera.example', date: 'Nov 2026', tier: 'Official' },
    { title: 'Sample Metro Authority – Line 2 extension update',       domain: 'samplemetro.example', date: 'Mar 2025', tier: 'Official' },
    { title: 'Sample Roads Dept – Ring Road widening notification',    domain: 'sampleroads.example', date: 'Aug 2025', tier: 'Official' },
    { title: 'Resident forum – Northfield Orchid (Sample) threads',    domain: 'residenttalk.example', date: 'Oct 2026', tier: 'Community' },
    { title: 'Resident forum – Northfield Crest (Sample) threads',     domain: 'residenttalk.example', date: 'Sep 2026', tier: 'Community' },
  ],
};

// ================================================================
// SAMPLE B – Delays
// ================================================================
export const SAMPLE_B: PropertyAnalysisFixture = {
  id: 'sample-b',
  label: 'Sample B: project with delays',
  property: {
    name: 'Riverbend Heights (Sample)',
    builder: 'Greenline Developers (Sample)',
    locality: 'Riverside Zone',
    city: 'Sample City',
  },
  coverage: {
    pages: 7,
    searches: 5,
    notFound: 2,
    level: 'Medium',
    reason: 'Registration record found; possession date differs; builder history from three completed projects.',
  },
  crossPortal: {
    headline: 'Prices are consistent across sources; possession date matches on all three portals.',
    note: 'Asking prices are not sale prices.',
    rows: [
      { source: 'Homefront Portal (Sample)', tier: 'Portal',  price: 9200000, areaSqft: 1180, possession: 'Mar 2027', date: 'Nov 2026' },
      { source: 'Nestlink Portal (Sample)',  tier: 'Portal',  price: 9450000, areaSqft: 1180, possession: 'Mar 2027', date: 'Nov 2026' },
      { source: 'Greenline Developers (Sample) Website', tier: 'Builder', price: 9300000, areaSqft: 1180, possession: 'Mar 2027', date: 'Oct 2026' },
    ],
  },
  builderRecord: {
    headline: 'Three of four completed projects slipped; the median slip across those three was 11 months.',
    note: 'Handover dates are as reported on the registration portal.',
    projects: [
      { name: 'Greenline Meadows (Sample)',   promised: 'Sep 2018', reported: 'Sep 2018', slipMonths: 0,  status: 'completed' },
      { name: 'Greenline Springs (Sample)',   promised: 'Mar 2021', reported: 'Sep 2021', slipMonths: 6,  status: 'completed' },
      { name: 'Greenline Terraces (Sample)',  promised: 'Jun 2022', reported: 'May 2023', slipMonths: 11, status: 'completed' },
      { name: 'Greenline Palms (Sample)',     promised: 'Dec 2022', reported: 'Jul 2024', slipMonths: 19, status: 'completed' },
      { name: 'Riverbend Heights (Sample)',   promised: 'Mar 2027', reported: null,       slipMonths: null, status: 'under construction' },
    ],
  },
  registration: {
    headline: 'The registered completion date is ten months after the listed one.',
    claims: [
      { claim: 'Registration number',  listingValue: 'RZ/RERA/2024/0119', recordValue: 'RZ/RERA/2024/0119', status: 'Verified', source: 'Sample Regulator Portal (Sample)' },
      { claim: 'Possession date',       listingValue: 'Mar 2027',           recordValue: 'Jan 2028',           status: 'Differs', source: 'Sample Regulator Portal (Sample)' },
      { claim: 'Flood mitigation plan', listingValue: 'Approved',           recordValue: '',                   status: 'Not found in the sources checked', source: '' },
    ],
  },
  announcements: {
    headline: 'The nearest metro station is under construction 2.1 km away; local reports note road waterlogging.',
    items: [
      { title: 'Sample Metro Green Line – Station 7 (Sample)', date: 'Jan 2024', status: 'Under construction', distanceKm: 2.1, source: 'Sample Metro Authority (Sample)' },
      { title: 'Adjacent road waterlogging report (Sample)',   date: 'Sep 2025', status: 'Announced',          distanceKm: 0.1, source: 'Local News Weekly (Sample)' },
    ],
  },
  voices: {
    headline: 'Possession delay is the most-mentioned topic, 9 of 21.',
    n: 21,
    from: 'Mar 2026',
    to: 'Oct 2026',
    scope: "Residents and buyers of Greenline Developers (Sample) earlier projects; this project is not yet built.",
    topics: [
      { topic: 'Possession delay', mentions: 9 },
      { topic: 'Maintenance', mentions: 5 },
      { topic: 'Refund queries', mentions: 4 },
      { topic: 'Other', mentions: 3 },
    ],
  },
  listingHistory: {
    headline: 'Price rose 3.1% over listing period; none of eight photos appear on other project pages.',
    firstSeen: 'Jul 2025',
    priceChanges: 2,
    startPrice: 8900000,
    currentPrice: 9200000,
    mediaReuse: { photos: 8, reused: 0 },
  },
  settleFirst: {
    claim: 'Possession date: 10-month gap between listing and registration record',
    question: 'Which possession date is contractual: March 2027 (listing) or January 2028 (registration record)?',
  },
  checks: [
    'Request the registered completion date from the builder in writing.',
    'Ask what contractual remedies apply if the registered date is missed.',
    'Review the sample regulator portal entry for any conditions or pending approvals.',
  ],
  sources: [
    { title: 'Homefront Portal listing – Riverbend Heights (Sample)', domain: 'homefront.example', date: 'Nov 2026', tier: 'Portal' },
    { title: 'Nestlink Portal listing – Riverbend Heights (Sample)',  domain: 'nestlink.example',  date: 'Nov 2026', tier: 'Portal' },
    { title: 'Greenline Developers (Sample) – project page',         domain: 'greenlinedevelopers.example', date: 'Oct 2026', tier: 'Builder' },
    { title: 'Sample Regulator Portal – registration RZ/RERA/2024/0119', domain: 'samplerera.example', date: 'Nov 2026', tier: 'Official' },
    { title: 'Sample Metro Authority – Green Line update',           domain: 'samplemetro.example', date: 'Jan 2024', tier: 'Official' },
    { title: 'Local News Weekly (Sample) – road waterlogging report', domain: 'localnewsweekly.example', date: 'Sep 2025', tier: 'News' },
    { title: 'Resident forum – Greenline Palms (Sample) threads',    domain: 'residenttalk.example', date: 'Oct 2026', tier: 'Community' },
  ],
};

// ================================================================
// SAMPLE C – Thin evidence
// ================================================================
export const SAMPLE_C: PropertyAnalysisFixture = {
  id: 'sample-c',
  label: 'Sample C: little information online',
  property: {
    name: 'Hillcrest Greens (Sample)',
    builder: 'Newleaf Homes (Sample)',
    locality: 'Hillcrest Zone',
    city: 'Sample City',
  },
  coverage: {
    pages: 2,
    searches: 4,
    notFound: 7,
    level: 'Low',
    reason: 'Two pages found; no registration record, no earlier projects, no local news.',
  },
  crossPortal: {
    headline: 'Only two sources found; prices are within 1% of each other.',
    note: 'Asking prices are not sale prices. Only two sources were found; independent verification is not possible from the sources checked.',
    rows: [
      { source: 'Homefront Portal (Sample)', tier: 'Portal', price: 7800000, areaSqft: 1050, possession: 'Dec 2027', date: 'Nov 2026' },
      { source: 'Newleaf Homes (Sample) Website', tier: 'Builder', price: 7850000, areaSqft: 1050, possession: 'Dec 2027', date: 'Nov 2026' },
    ],
  },
  builderRecord: {
    headline: 'Not found in the sources checked.',
    note: 'Not found in the sources checked does not mean it does not exist.',
    projects: [],
  },
  registration: {
    headline: 'No registration record was found in the sources checked.',
    claims: [
      { claim: 'Registration number', listingValue: 'Not stated', recordValue: '', status: 'Not found in the sources checked', source: '' },
      { claim: 'Possession date',     listingValue: 'Dec 2027',   recordValue: '', status: 'Not found in the sources checked', source: '' },
      { claim: 'Approvals',           listingValue: 'Stated as obtained', recordValue: '', status: 'Not found in the sources checked', source: '' },
    ],
  },
  announcements: {
    headline: 'Not found in the sources checked.',
    items: [],
  },
  voices: {
    headline: 'Not found in the sources checked.',
    n: 0,
    from: '',
    to: '',
    scope: 'No earlier projects found; no resident discussions found in the sources checked.',
    topics: [],
  },
  listingHistory: {
    headline: 'Listing appeared 3 months ago; one of five photos also appears on a page for a different builder.',
    firstSeen: 'Aug 2026',
    priceChanges: 0,
    startPrice: 7800000,
    currentPrice: 7800000,
    mediaReuse: { photos: 5, reused: 1 },
  },
  settleFirst: {
    claim: 'No registration record or approvals found',
    question: 'Ask for the registration number and the approvals, because none could be found in the sources checked.',
  },
  checks: [
    'Ask the builder for the registration number and verify it on the official regulator portal.',
    'Request copies of key approvals (building plan, environmental clearance, land title).',
    'Ask whether any earlier projects by this builder are completed and visit them.',
  ],
  sources: [
    { title: 'Homefront Portal listing – Hillcrest Greens (Sample)', domain: 'homefront.example', date: 'Nov 2026', tier: 'Portal' },
    { title: 'Newleaf Homes (Sample) – project page',                domain: 'newleafhomes.example', date: 'Nov 2026', tier: 'Builder' },
  ],
};

// ================================================================
// Map & hash utilities
// ================================================================
export const FIXTURES: Record<string, PropertyAnalysisFixture> = {
  'sample-a': SAMPLE_A,
  'sample-b': SAMPLE_B,
  'sample-c': SAMPLE_C,
};

export const SAMPLE_CHIPS = [
  { id: 'sample-a' as const, label: 'Sample A: well-documented project', url: 'https://listings.example/sample-a' },
  { id: 'sample-b' as const, label: 'Sample B: project with delays',     url: 'https://listings.example/sample-b' },
  { id: 'sample-c' as const, label: 'Sample C: little information online', url: 'https://listings.example/sample-c' },
];

/** Deterministic hash: maps any URL to one of the three samples */
export function hashUrlToFixtureId(url: string): 'sample-a' | 'sample-b' | 'sample-c' {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) >>> 0;
  }
  const ids = ['sample-a', 'sample-b', 'sample-c'] as const;
  return ids[h % 3];
}

export function getFixtureForUrl(url: string): PropertyAnalysisFixture {
  return FIXTURES[hashUrlToFixtureId(url)];
}

export const SIMULATED_DISCLAIMER =
  'Simulated demonstration. The link was not opened and no internet search was performed. All properties, builders, sources, dates and numbers are invented.';
