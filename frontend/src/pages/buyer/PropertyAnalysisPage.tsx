import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Upload, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Info, Clock, FileText, ExternalLink, Image as ImageIcon, Loader2, XCircle,
  ArrowLeft, Minus
} from 'lucide-react';
import {
  FIXTURES, SAMPLE_CHIPS, SIMULATED_DISCLAIMER,
  getFixtureForUrl, hashUrlToFixtureId,
  computedValues, pricePerSqft,
  type PropertyAnalysisFixture, type Tier, type ClaimStatus, type AnnouncementStatus
} from '../../demo/propertyAnalysis/fixtures';

// ── Feature flag ──────────────────────────────────────────────
const IS_DEMO = import.meta.env.VITE_PROPERTY_ANALYSIS_DEMO === 'true';

// ── Constants ─────────────────────────────────────────────────
const DISCLAIMER = SIMULATED_DISCLAIMER;

// ── Simulated research steps ──────────────────────────────────
const BASE_STEPS = [
  { label: 'Reading the listing page', sources: 1, detail: 'Retrieved listing from Homefront Portal (Sample) · 1 page read (sample).' },
  { label: 'Checking other portals', sources: 3, detail: 'Found Nestlink Portal (Sample) and Urbanview Portal (Sample) · 2 additional pages (sample).' },
  { label: 'Looking for the registration record', sources: 1, detail: 'Queried Sample Regulator Portal (Sample) · record located (sample).' },
  { label: 'Reading the builder\'s earlier projects', sources: 2, detail: 'Found 4 earlier project entries on registration portal · handover dates noted (sample).' },
  { label: 'Searching local news and announcements', sources: 1, detail: 'Searched Local News Weekly (Sample) archive · 1 relevant result (sample).' },
  { label: 'Reading what residents say', sources: 2, detail: 'Read resident forum threads for two completed projects · 38 mentions indexed (sample).' },
  { label: 'Cross-checking and writing the report', sources: 0, detail: 'Cross-referenced all sources · discrepancies identified · report composed (sample).' },
];

const PICTURE_STEP = {
  label: 'Reading picture (simulated)',
  detail: 'Picture shows a residential tower with balconies and landscaping (sample). No data was sent.',
};

// ── Utility formatters ────────────────────────────────────────
function formatRs(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatPpsf(n: number): string {
  return `₹${n.toLocaleString('en-IN')} / sq ft`;
}

// ── Shared chips / badges ─────────────────────────────────────
const tierColour: Record<Tier, string> = {
  Official: 'bg-blue-50 text-blue-800 border-blue-200',
  News: 'bg-amber-50 text-amber-800 border-amber-200',
  Portal: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Community: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Builder: 'bg-slate-100 text-slate-700 border-slate-200',
};

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tierColour[tier]}`}>
      {tier}
    </span>
  );
}

const statusConfig: Record<ClaimStatus, { icon: React.ReactNode; cls: string; label: string }> = {
  'Verified': { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Verified' },
  'Differs': { icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Differs' },
  'Not found in the sources checked': { icon: <Minus className="w-3.5 h-3.5" />, cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Not found' },
};

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const announcementCols: Record<AnnouncementStatus, string> = {
  'Announced': 'bg-slate-100 text-slate-700 border-slate-200',
  'Approved': 'bg-blue-50 text-blue-800 border-blue-200',
  'Tender': 'bg-purple-50 text-purple-800 border-purple-200',
  'Under construction': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Land acquisition': 'bg-amber-50 text-amber-800 border-amber-200',
};

function AnnouncementBadge({ status }: { status: AnnouncementStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${announcementCols[status]}`}>
      {status}
    </span>
  );
}

function SampleBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold tracking-wide">
      Sample
    </span>
  );
}

function DisclaimerBanner() {
  return (
    <div
      role="note"
      aria-label="Simulation disclaimer"
      className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900"
    >
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <span>{DISCLAIMER}</span>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function ReportSection({ title, finding, children }: { title: string; finding: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <SampleBadge />
          </div>
          <p className="text-xs text-slate-700 mt-0.5 font-medium">{finding}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function SourceChip({ title, domain, date, tier }: { title: string; domain: string; date: string; tier: Tier }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 flex-wrap">
      <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
      <span className="font-medium">{title}</span>
      <span className="text-slate-400">·</span>
      <code className="text-indigo-700 font-mono">{domain}</code>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">{date}</span>
      <TierBadge tier={tier} />
    </span>
  );
}

function MyViewLine({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 italic border-t border-slate-100 pt-2">
      <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
      <span><strong className="not-italic font-semibold text-slate-700">My view would change if:</strong> {text}</span>
    </div>
  );
}

// ── Section 1: Cross-portal ───────────────────────────────────
function CrossPortalSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { crossPortal } = fixture;
  const cv = computedValues(fixture);
  const minPpsf = Math.min(...cv.ppsf);
  const maxPpsf = Math.max(...cv.ppsf);

  return (
    <ReportSection title="Does the listing hold up?" finding={crossPortal.headline}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-3 py-2 font-semibold border border-slate-200 rounded-tl">Source</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Tier</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Price</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Area (sq ft)</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">₹ / sq ft</th>
              <th className="px-3 py-2 font-semibold border border-slate-200 rounded-tr">Possession</th>
            </tr>
          </thead>
          <tbody>
            {crossPortal.rows.map((row, i) => {
              const ppsf = pricePerSqft(row.price, row.areaSqft);
              const isLow = ppsf === minPpsf && crossPortal.rows.length > 1;
              const isHigh = ppsf === maxPpsf && crossPortal.rows.length > 1;
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800">{row.source}</td>
                  <td className="px-3 py-2 border border-slate-200"><TierBadge tier={row.tier} /></td>
                  <td className="px-3 py-2 border border-slate-200 font-mono">{formatRs(row.price)}</td>
                  <td className="px-3 py-2 border border-slate-200 font-mono">{row.areaSqft.toLocaleString()}</td>
                  <td className="px-3 py-2 border border-slate-200 font-mono">
                    {formatPpsf(ppsf)}
                    {isHigh && crossPortal.rows.length > 2 && <span className="ml-1 text-amber-700 font-semibold text-[10px]"> ▲ highest</span>}
                    {isLow && crossPortal.rows.length > 2 && <span className="ml-1 text-blue-700 font-semibold text-[10px]"> ▼ lowest</span>}
                  </td>
                  <td className="px-3 py-2 border border-slate-200">{row.possession}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dot plot */}
      {crossPortal.rows.length > 1 && (
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-slate-600 mb-1.5">Price per sq ft across sources</div>
          <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
            {(() => {
              const min = Math.min(...cv.ppsf) - 100;
              const max = Math.max(...cv.ppsf) + 100;
              const range = max - min;
              return cv.ppsf.map((p, i) => {
                const left = ((p - min) / range) * 100;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow"
                    style={{ left: `${left}%` }}
                    title={`${crossPortal.rows[i].source}: ${formatPpsf(p)}`}
                    aria-label={`${crossPortal.rows[i].source}: ${formatPpsf(p)}`}
                  />
                );
              });
            })()}
          </div>
          {cv.ppsf.length > 1 && (
            <div className="mt-1 text-[11px] text-slate-500">
              Spread: {formatPpsf(Math.min(...cv.ppsf))} – {formatPpsf(Math.max(...cv.ppsf))}
              {' '}({cv.priceSpreadPct}% across all sources listed)
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-500 italic">{crossPortal.note}</p>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {fixture.sources.filter(s => s.tier === 'Portal' || s.tier === 'Builder').map((s, i) => (
          <SourceChip key={i} {...s} />
        ))}
      </div>

      <MyViewLine text="the area and price per sq ft were confirmed by an independent valuer." />
    </ReportSection>
  );
}

// ── Section 2: Builder record ─────────────────────────────────
function BuilderSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { builderRecord } = fixture;
  if (builderRecord.projects.length === 0) {
    return (
      <ReportSection title="The builder's record" finding={builderRecord.headline}>
        <p className="text-sm text-slate-600">{builderRecord.headline}</p>
        <p className="text-xs text-slate-500 italic">{builderRecord.note}</p>
        <MyViewLine text="earlier projects by this builder were found and their handover dates were confirmed." />
      </ReportSection>
    );
  }

  const completed = builderRecord.projects.filter(p => p.status === 'completed' && p.slipMonths !== null);
  const cv = computedValues(fixture);

  return (
    <ReportSection title="The builder's record" finding={builderRecord.headline}>
      <div className="space-y-2">
        {builderRecord.projects.map((p, i) => {
          const isUnderConstruction = p.status === 'under construction';
          const slip = p.slipMonths ?? 0;
          const maxSlip = Math.max(...completed.map(c => c.slipMonths ?? 0), 1);
          const slipWidth = isUnderConstruction ? 0 : Math.max((slip / (maxSlip + 2)) * 70, slip === 0 ? 0 : 5);

          return (
            <div key={i} className="text-xs">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="font-medium text-slate-800">{p.name}</span>
                {isUnderConstruction ? (
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] font-semibold">Under construction</span>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${slip === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : slip <= 6 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {slip === 0 ? 'On time' : `+${slip} months`}
                  </span>
                )}
              </div>
              <div className="text-slate-500 mb-1">Promised: {p.promised}{p.reported ? ` · Reported: ${p.reported}` : ''}</div>
              {!isUnderConstruction && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '30%' }} aria-hidden />
                  {slip > 0 && (
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${slipWidth}%` }} aria-hidden />
                  )}
                </div>
              )}
              {!isUnderConstruction && (
                <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                  <span>▮ Promised window</span>
                  {slip > 0 && <span className="text-red-500">▮ Slip</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <strong>{cv.withinSix}</strong> of <strong>{completed.length}</strong> completed projects handed over within 6 months ·
          Median slip: <strong>{cv.medianSlip} months</strong> (across completed projects with slips)
        </div>
      )}

      <p className="text-[11px] text-slate-500 italic">{builderRecord.note}</p>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {fixture.sources.filter(s => s.tier === 'Official').slice(0, 1).map((s, i) => (
          <SourceChip key={i} {...s} />
        ))}
      </div>

      <MyViewLine text="the builder provided documentation confirming OC dates for all completed projects." />
    </ReportSection>
  );
}

// ── Section 3: Registration ───────────────────────────────────
function RegistrationSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { registration } = fixture;
  return (
    <ReportSection title="What the registration record says" finding={registration.headline}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs border-collapse min-w-[480px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-3 py-2 font-semibold border border-slate-200">Claim</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Listing says</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Status</th>
              <th className="px-3 py-2 font-semibold border border-slate-200">Record says</th>
            </tr>
          </thead>
          <tbody>
            {registration.claims.map((c, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800">{c.claim}</td>
                <td className="px-3 py-2 border border-slate-200 text-slate-700">{c.listingValue}</td>
                <td className="px-3 py-2 border border-slate-200"><ClaimStatusBadge status={c.status} /></td>
                <td className="px-3 py-2 border border-slate-200 text-slate-600">
                  {c.status === 'Differs' ? <span className="font-semibold">{c.recordValue}</span> : c.status === 'Verified' ? c.recordValue : <span className="italic text-slate-400">Not found in the sources checked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 italic">Not found in the sources checked does not mean it does not exist.</p>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {fixture.sources.filter(s => s.tier === 'Official').map((s, i) => (
          <SourceChip key={i} {...s} />
        ))}
      </div>

      <MyViewLine text="the builder provided the registration extract and all stated approvals were listed." />
    </ReportSection>
  );
}

// ── Section 4: Announcements ──────────────────────────────────
function AnnouncementsSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { announcements } = fixture;
  if (announcements.items.length === 0) {
    return (
      <ReportSection title="Around the project: announcements" finding={announcements.headline}>
        <p className="text-sm text-slate-600 italic">Not found in the sources checked does not mean it does not exist.</p>
        <MyViewLine text="local authority announcements were found and their status was confirmed." />
      </ReportSection>
    );
  }

  return (
    <ReportSection title="Around the project: announcements" finding={announcements.headline}>
      <div className="space-y-2">
        {announcements.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-800">{item.title}</span>
                <AnnouncementBadge status={item.status} />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {item.date} · {item.distanceKm} km away · Source: {item.source}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-800 font-medium mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
        ⚠ Announced is not built. Status chips show the stage at the time of the sources checked, not an expected completion date.
      </p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {fixture.sources.filter(s => s.tier === 'Official' || s.tier === 'News').map((s, i) => (
          <SourceChip key={i} {...s} />
        ))}
      </div>
      <MyViewLine text="the stated infrastructure moved to the next stage or was completed." />
    </ReportSection>
  );
}

// ── Section 5: Voices ─────────────────────────────────────────
function VoicesSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { voices } = fixture;
  if (voices.n === 0 || voices.topics.length === 0) {
    return (
      <ReportSection title="What people mention" finding={voices.headline}>
        <p className="text-sm text-slate-600 italic">{voices.scope}</p>
        <p className="text-[11px] text-slate-500 italic">Not found in the sources checked does not mean it does not exist.</p>
        <MyViewLine text="resident discussions for this or the builder's other projects were found." />
      </ReportSection>
    );
  }

  const maxMentions = Math.max(...voices.topics.map(t => t.mentions));
  return (
    <ReportSection title="What people mention" finding={voices.headline}>
      <div className="space-y-2">
        {voices.topics.map((topic, i) => (
          <div key={i} className="text-xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium text-slate-700">{topic.topic}</span>
              <span className="text-slate-500">{topic.mentions} of {voices.n}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-600 rounded-full"
                style={{ width: `${(topic.mentions / maxMentions) * 100}%` }}
                aria-label={`${topic.topic}: ${topic.mentions} mentions`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-500 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-2">
        {voices.n} mentions · {voices.from} to {voices.to} · {voices.scope}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {fixture.sources.filter(s => s.tier === 'Community').map((s, i) => (
          <SourceChip key={i} {...s} />
        ))}
      </div>
      <MyViewLine text="structured surveys from residents of this specific project were available." />
    </ReportSection>
  );
}

// ── Section 6: Listing history ────────────────────────────────
function ListingHistorySection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { listingHistory } = fixture;
  const cv = computedValues(fixture);
  return (
    <ReportSection title="The listing's own history" finding={listingHistory.headline}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'First seen', value: listingHistory.firstSeen },
          { label: 'Price changes', value: `${listingHistory.priceChanges}` },
          { label: 'Start price', value: formatRs(listingHistory.startPrice) },
          { label: 'Current price', value: formatRs(listingHistory.currentPrice) },
        ].map(({ label, value }) => (
          <div key={label} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {listingHistory.startPrice !== listingHistory.currentPrice && (
        <div className="text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          Price change: {cv.priceChangePct > 0 ? '+' : ''}{cv.priceChangePct}% since first listed
        </div>
      )}

      <div className="text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
        Photo media check: {listingHistory.mediaReuse.photos} photos checked ·{' '}
        <strong>{listingHistory.mediaReuse.reused}</strong> {listingHistory.mediaReuse.reused === 1 ? 'also appears' : 'also appear'} on pages for other projects
        {listingHistory.mediaReuse.reused > 0 && (
          <span className="ml-1 text-amber-700 font-semibold">(worth asking the builder)</span>
        )}
      </div>

      <MyViewLine text="the listing was removed and re-listed, suggesting the history shown is incomplete." />
    </ReportSection>
  );
}

// ── Section 7: Settle first ───────────────────────────────────
function SettleFirstSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const { settleFirst } = fixture;
  return (
    <ReportSection title="Settle this first" finding={settleFirst.claim}>
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-900">{settleFirst.question}</p>
        </div>
      </div>
    </ReportSection>
  );
}

// ── Section 8: Checks ─────────────────────────────────────────
function ChecksSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  return (
    <ReportSection title="Checks you can make now" finding="Up to three checks grounded in the sources above.">
      <ul className="space-y-2">
        {fixture.checks.map((check, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
            <span>{check}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500 italic mt-2">These checks do not constitute advice to buy, book, skip or wait.</p>
    </ReportSection>
  );
}

// ── Section 9: Sources (collapsed) ────────────────────────────
function SourcesSection({ fixture }: { fixture: PropertyAnalysisFixture }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Sources ({fixture.sources.length})</span>
          <SampleBadge />
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="p-4 space-y-2">
          {fixture.sources.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="text-slate-400 font-mono w-5 flex-shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <span className="font-medium">{s.title}</span>
                <span className="text-slate-400 mx-1">·</span>
                <code className="text-indigo-700 font-mono">{s.domain}</code>
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-slate-500">{s.date}</span>
                <span className="ml-1.5"><TierBadge tier={s.tier} /></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Progress log ──────────────────────────────────────────────
interface ProgressLogProps {
  withPictureStep: boolean;
  onDone: () => void;
  onCancel: () => void;
}

function ProgressLog({ withPictureStep, onDone, onCancel }: ProgressLogProps) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps = withPictureStep
    ? [{ label: PICTURE_STEP.label, sources: 0, detail: PICTURE_STEP.detail }, ...BASE_STEPS]
    : BASE_STEPS;

  const [completed, setCompleted] = useState<number>(prefersReduced ? steps.length : 0);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (prefersReduced) { onDone(); return; }
    if (cancelled) return;
    if (completed >= steps.length) { onDone(); return; }

    const delay = completed === 0 ? 400 : 900 + Math.random() * 500;
    const t = setTimeout(() => {
      if (!cancelled) setCompleted(c => c + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [completed, cancelled, steps.length, prefersReduced, onDone]);

  return (
    <div className="space-y-3">
      <DisclaimerBanner />
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className={`w-4 h-4 text-slate-500 ${completed < steps.length ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold text-slate-700">Simulated research steps</span>
          </div>
          {completed < steps.length && (
            <button
              type="button"
              onClick={() => { setCancelled(true); onCancel(); }}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
        <ul
          aria-live="polite"
          aria-label="Simulated research steps"
          className="divide-y divide-slate-100"
        >
          {steps.map((step, i) => {
            const done = i < completed;
            const active = i === completed && completed < steps.length;
            return (
              <li
                key={i}
                className={`flex items-start gap-3 px-4 py-3 text-xs transition-opacity ${done || active ? 'opacity-100' : 'opacity-30'}`}
              >
                <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : active ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">
                    {step.label}
                    {step.sources > 0 && <span className="ml-1.5 text-slate-400 font-normal">({step.sources} source{step.sources > 1 ? 's' : ''})</span>}
                  </div>
                  {(done || active) && (
                    <div className="text-slate-500 mt-0.5">{step.detail}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── Full Report ───────────────────────────────────────────────
function AnalysisReport({ fixture, selectedBy }: { fixture: PropertyAnalysisFixture; selectedBy: string }) {
  const { property, coverage } = fixture;
  const coverageCls = { High: 'text-emerald-700 bg-emerald-50 border-emerald-200', Medium: 'text-amber-700 bg-amber-50 border-amber-200', Low: 'text-red-700 bg-red-50 border-red-200' }[coverage.level];

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Report header */}
      <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{property.name}</h2>
              <SampleBadge />
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{property.builder} · {property.locality}, {property.city}</div>
          </div>
          <div className="text-xs text-slate-500 italic">{selectedBy}</div>
        </div>

        {/* Coverage strip */}
        <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
          <div className="flex gap-3 text-xs text-slate-700">
            <span><strong>{coverage.pages}</strong> pages read</span>
            <span>·</span>
            <span><strong>{coverage.searches}</strong> searches</span>
            <span>·</span>
            <span><strong>{coverage.notFound}</strong> not found</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${coverageCls}`}>
            {coverage.level} coverage
          </span>
          <span className="text-[11px] text-slate-500">{coverage.reason}</span>
        </div>
      </div>

      {/* Report sections */}

      <CrossPortalSection fixture={fixture} />
      <BuilderSection fixture={fixture} />
      <RegistrationSection fixture={fixture} />
      <AnnouncementsSection fixture={fixture} />
      <VoicesSection fixture={fixture} />
      <ListingHistorySection fixture={fixture} />
      <SettleFirstSection fixture={fixture} />
      <ChecksSection fixture={fixture} />
      <SourcesSection fixture={fixture} />

      {/* Report footer */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export const PropertyAnalysisPage: React.FC = () => {
  // Inject noindex meta tag into document.head
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      if (meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, []);

  // If not in demo mode, show unavailable message
  if (!IS_DEMO) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Property analysis</h1>
        <p className="text-slate-600">Property analysis is not available yet.</p>
      </div>
    );
  }

  const [tab, setTab] = useState<'link' | 'picture'>('link');
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState('');
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [phase, setPhase] = useState<'input' | 'progress' | 'report'>('input');
  const [fixture, setFixture] = useState<PropertyAnalysisFixture | null>(null);
  const [selectedBy, setSelectedBy] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevObjUrl = useRef<string | null>(null);

  // Revoke old object URL
  useEffect(() => {
    return () => {
      if (prevObjUrl.current) URL.revokeObjectURL(prevObjUrl.current);
    };
  }, []);

  const handleChipClick = (chip: typeof SAMPLE_CHIPS[0]) => {
    setSelectedChipId(chip.id);
    setLinkValue(chip.url);
    setLinkError('');
  };

  const validateLink = (val: string) => {
    if (!val.trim()) return 'Please enter a URL.';
    try {
      const u = new URL(val.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'URL must start with http:// or https://';
    } catch {
      return 'Please enter a valid URL starting with http:// or https://';
    }
    return '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Only JPG, PNG or WebP images are accepted.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError('Image must be under 8 MB.');
      return;
    }

    if (prevObjUrl.current) URL.revokeObjectURL(prevObjUrl.current);
    const url = URL.createObjectURL(file);
    prevObjUrl.current = url;
    setImageFile(file);
    setImagePreviewUrl(url);
  };

  const handleAnalyse = () => {
    if (tab === 'link') {
      const err = validateLink(linkValue);
      if (err) { setLinkError(err); return; }

      let fx: PropertyAnalysisFixture;
      let howChosen: string;
      if (selectedChipId && FIXTURES[selectedChipId]) {
        fx = FIXTURES[selectedChipId];
        howChosen = `Showing: ${fx.label} (chip selected)`;
      } else {
        const id = hashUrlToFixtureId(linkValue.trim());
        fx = FIXTURES[id];
        howChosen = `Showing: ${fx.label} (chosen from your link)`;
      }
      setFixture(fx);
      setSelectedBy(howChosen);
    } else {
      // Picture flow: always use Sample A
      const fx = FIXTURES['sample-a'];
      setFixture(fx);
      setSelectedBy('Showing: Sample A: well-documented project (picture upload)');
    }
    setPhase('progress');
  };

  const handleProgressDone = useCallback(() => setPhase('report'), []);
  const handleCancel = useCallback(() => { setPhase('input'); setFixture(null); }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* noindex hint in head (dev only) */}

      <div className="flex items-start gap-3">
        {phase !== 'input' && (
          <button
            type="button"
            onClick={() => { setPhase('input'); setFixture(null); }}
            className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Start over"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property analysis</h1>
          <p className="text-sm text-slate-500 mt-0.5">What AI web research on a property would show — simulated demonstration.</p>
        </div>
      </div>

      {phase === 'input' && (
        <div className="space-y-4">
          <DisclaimerBanner />

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200">
              {(['link', 'picture'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-slate-900 border-b-2 border-slate-900 -mb-px' : 'text-slate-500 hover:text-slate-700 bg-slate-50'}`}
                >
                  {t === 'link' ? '🔗 Paste a link' : '📷 Upload a picture'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {tab === 'link' ? (
                <>
                  <div>
                    <label htmlFor="property-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Property listing URL
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="property-url"
                          type="url"
                          value={linkValue}
                          onChange={e => { setLinkValue(e.target.value); setLinkError(''); setSelectedChipId(null); }}
                          placeholder="https://listings.example/sample-a"
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${linkError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                          aria-describedby={linkError ? 'url-error' : 'url-helper'}
                        />
                      </div>
                    </div>
                    {linkError && <p id="url-error" role="alert" className="text-xs text-red-600 mt-1">{linkError}</p>}
                    <p id="url-helper" className="text-xs text-slate-500 mt-1.5">
                      In the live version the AI will read this page and search the web. In this demo, the link is only used to choose a sample.
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-2">Or choose a sample:</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {SAMPLE_CHIPS.map(chip => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-all ${selectedChipId === chip.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">Upload a property picture</div>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-slate-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                      tabIndex={0}
                      role="button"
                      aria-label="Click to upload a picture"
                    >
                      {imagePreviewUrl ? (
                        <div className="relative inline-block">
                          <img src={imagePreviewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow" />
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={e => { e.stopPropagation(); setImageFile(null); if (prevObjUrl.current) { URL.revokeObjectURL(prevObjUrl.current); prevObjUrl.current = null; } setImagePreviewUrl(null); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <div className="text-sm font-medium text-slate-600">Click to upload a picture</div>
                          <div className="text-xs text-slate-400 mt-0.5">JPG, PNG or WebP · max 8 MB</div>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleFileChange}
                      aria-label="Upload property picture"
                    />
                    {imageError && <p role="alert" className="text-xs text-red-600 mt-1">{imageError}</p>}
                    <p className="text-xs text-slate-500 mt-1.5">
                      This demo does not upload or analyse the picture. It shows a sample result.
                    </p>
                  </div>

                  {imageFile && (
                    <div className="text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      Selected: <strong>{imageFile.name}</strong> ({(imageFile.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleAnalyse}
                disabled={tab === 'picture' && !imageFile}
                className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Analyse
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'progress' && (
        <ProgressLog
          withPictureStep={tab === 'picture'}
          onDone={handleProgressDone}
          onCancel={handleCancel}
        />
      )}

      {phase === 'report' && fixture && (
        <AnalysisReport fixture={fixture} selectedBy={selectedBy} />
      )}
    </div>
  );
};

export default PropertyAnalysisPage;
