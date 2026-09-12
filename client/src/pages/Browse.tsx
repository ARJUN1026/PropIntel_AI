import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, SlidersHorizontal, X, ArrowUpDown, Loader2 } from 'lucide-react';
import { propertyApi, aiApi, savedApi, errMessage, type PropertyFilters } from '../api';
import type { PropertyDoc, SearchResultDoc, ExtractedCriteria } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { Button, Input, Select, EmptyState, CardGridSkeleton, Modal, Field, toast, Card } from '../components/ui';
import { formatPrice, label, cn } from '../lib/ui';

const CITIES = ['Bangalore', 'Dehradun', 'Delhi NCR', 'Noida', 'Gurgaon', 'Pune', 'Mumbai', 'Hyderabad', 'Chandigarh'];
const TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'VILLA', 'PLOT', 'OFFICE'];
const AMENITIES = ['Gym', 'Swimming Pool', 'Parking', 'Lift', 'Security', 'Power Backup', 'Garden', 'Clubhouse'];
const PAGE_SIZE = 12;

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'match';

const EXAMPLE_QUERIES = [
  '3BHK in Bangalore under 1.2 crore near Whitefield with parking and a gym',
  '2BHK for rent in Pune around 35 lakh budget',
  'Villa in Hyderabad above 2 crore with clubhouse and security',
  'Office space in Mumbai under 3 crore',
];

export function BrowsePage() {
  const queryClient = useQueryClient();

  // ---- AI search state ----
  const [nlQuery, setNlQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [aiResults, setAiResults] = useState<SearchResultDoc[] | null>(null);
  const [criteria, setCriteria] = useState<ExtractedCriteria | null>(null);
  const [exampleOpen, setExampleOpen] = useState(false);

  // ---- filter state ----
  const [filters, setFilters] = useState<PropertyFilters>({ page: '1', limit: String(PAGE_SIZE) });
  const [sort, setSort] = useState<SortKey>('newest');
  const [filterDraft, setFilterDraft] = useState<Partial<PropertyFilters>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // ---- saved + compare state ----
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const params = useMemo(() => ({ ...filters, ...filterDraft, page: filters.page ?? '1' }), [filters, filterDraft]);

  const listQuery = useQuery({
    queryKey: ['properties', params],
    queryFn: () => propertyApi.list(params),
  });

  const savedQuery = useQuery({ queryKey: ['saved-ids'], queryFn: () => savedApi.list(), enabled: true });

  useEffect(() => {
    if (savedQuery.data) setSavedIds(new Set(savedQuery.data.items.map(p => p._id)));
  }, [savedQuery.data]);

  const properties: PropertyDoc[] = aiResults ? aiResults.map(r => r.property) : (listQuery.data?.items ?? []);

  const sorted: { property: PropertyDoc; matchScore?: number; reasons?: string[] }[] = useMemo(() => {
    let rows: { property: PropertyDoc; matchScore?: number; reasons?: string[] }[] = properties.map(p => ({ property: p }));
    if (aiResults) {
      rows = aiResults.map(r => ({ property: r.property, matchScore: r.matchScore, reasons: r.reasons }));
      if (sort === 'price_asc') rows.sort((a, b) => a.property.price - b.property.price);
      if (sort === 'price_desc') rows.sort((a, b) => b.property.price - a.property.price);
      return rows;
    }
    if (sort === 'price_asc') rows.sort((a, b) => a.property.price - b.property.price);
    if (sort === 'price_desc') rows.sort((a, b) => b.property.price - a.property.price);
    return rows;
  }, [aiResults, properties, sort]);

  /* ---------- actions ---------- */

  async function runAiSearch(): Promise<void> {
    if (nlQuery.trim().length < 3) {
      toast('Describe what you are looking for', 'err');
      return;
    }
    setSearching(true);
    try {
      const r = await aiApi.search(nlQuery.trim());
      setAiResults(r.results);
      setCriteria(r.criteria);
      toast(`${r.results.length} matches — chips show what the AI understood`);
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setSearching(false);
    }
  }

  function clearAi(): void {
    setAiResults(null);
    setCriteria(null);
    setNlQuery('');
  }

  async function toggleSave(id: string): Promise<void> {
    const next = new Set(savedIds);
    if (next.has(id)) {
      next.delete(id);
      await savedApi.unsave(id).catch(() => toast('Could not update saved list', 'err'));
    } else {
      next.add(id);
      await savedApi.save(id).catch(() => toast('Could not save property', 'err'));
    }
    setSavedIds(next);
    queryClient.invalidateQueries({ queryKey: ['saved-ids'] });
    queryClient.invalidateQueries({ queryKey: ['saved'] });
  }

  function toggleCompare(id: string): void {
    setCompareIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? prev : [...prev, id]));
  }

  const activeChipCount = Object.entries(filterDraft).filter(([, v]) => Boolean(v)).length + (criteria ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">Search</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">Find your next property</h1>
        </div>
        <p className="font-mono text-2xs text-ink-faint nums">
          {aiResults ? `${aiResults.length} AI matches` : `${listQuery.data?.total ?? 0} listings`}
        </p>
      </div>

      {/* AI search panel */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-ink-soft">
            <Sparkles size={15} className="text-brass-600" />
            <p className="text-xs font-medium">Describe it in plain language — the AI extracts your requirements</p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Input
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAiSearch()}
              placeholder="e.g. 3BHK in Bangalore under 1.2 crore near Whitefield with parking and a gym"
              className="h-11 flex-1"
            />
            <div className="flex gap-2.5">
              <Button onClick={runAiSearch} disabled={searching} size="lg" className="flex-1 sm:flex-none">
                {searching ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {searching ? 'Thinking…' : 'AI Search'}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setFilterOpen(true)}>
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Filters</span>
                {activeChipCount > 0 ? <span className="rounded-full bg-brass-100 px-1.5 font-mono text-2xs">{activeChipCount}</span> : null}
              </Button>
            </div>
          </div>

          {/* Extracted criteria chips */}
          {criteria ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="font-mono text-2xs uppercase tracking-wider text-ink-faint">AI understood:</span>
              {criteria.propertyType ? <Chip>{criteria.propertyType}</Chip> : null}
              {criteria.locations.map(l => <Chip key={l}>{l}</Chip>)}
              {criteria.city ? <Chip>{criteria.city}</Chip> : null}
              {criteria.budgetMin ? <Chip>min {formatPrice(criteria.budgetMin)}</Chip> : null}
              {criteria.budgetMax ? <Chip>≤ {formatPrice(criteria.budgetMax)}</Chip> : null}
              {criteria.amenities.map(a => <Chip key={a}>{a}</Chip>)}
              {criteria.parking ? <Chip>Parking</Chip> : null}
              {criteria.furnishing ? <Chip>{label(criteria.furnishing)}</Chip> : null}
              <span className="ml-1 font-mono text-2xs text-ink-faint nums">conf {(criteria.confidence * 100).toFixed(0)}%</span>
              <button onClick={clearAi} className="ml-2 flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-2xs text-ink-muted transition-colors hover:bg-ink/10">
                <X size={11} /> Clear
              </button>
            </div>
          ) : null}

          {!criteria && !aiResults ? (
            <button onClick={() => setExampleOpen(true)} className="self-start text-2xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Need an example query?
            </button>
          ) : null}
        </div>

        {/* Sort strip */}
        <div className="flex items-center justify-between border-t border-edge-light bg-canvas/60 px-5 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-2xs text-ink-muted">
            <ArrowUpDown size={12} />
            <span>Sort</span>
          </div>
          <div className="flex gap-1.5">
            {([
              ['match', 'Match'],
              ['newest', 'Newest'],
              ['price_asc', 'Price ↑'],
              ['price_desc', 'Price ↓'],
            ] as [SortKey, string][]).map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  'rounded-full px-3 py-1 font-mono text-2xs transition-colors',
                  sort === key ? 'bg-ink text-ink-inverse' : 'text-ink-muted hover:bg-ink/5',
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results */}
      {listQuery.isLoading ? (
        <CardGridSkeleton count={6} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No properties match"
          body="Try widening the budget, clearing filters, or rephrasing the search — the AI handles loose phrasing well."
          action={<Button variant="outline" onClick={clearAi}>Reset search</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((row, i) => (
            <PropertyCard
              key={row.property._id}
              property={row.property}
              matchScore={row.matchScore}
              reasons={row.reasons}
              saved={savedIds.has(row.property._id)}
              onToggleSave={toggleSave}
              selectable
              selected={compareIds.includes(row.property._id)}
              onSelect={toggleCompare}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Pagination (list mode only) */}
      {!aiResults && (listQuery.data?.pages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={Number(filters.page ?? 1) <= 1}
            onClick={() => setFilters(f => ({ ...f, page: String(Number(f.page ?? 1) - 1) }))}
          >
            Previous
          </Button>
          <span className="font-mono text-2xs text-ink-muted nums">
            Page {listQuery.data?.page} of {listQuery.data?.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={Number(filters.page ?? 1) >= (listQuery.data?.pages ?? 1)}
            onClick={() => setFilters(f => ({ ...f, page: String(Number(f.page ?? 1) + 1) }))}
          >
            Next
          </Button>
        </div>
      ) : null}

      {/* Compare bar */}
      {compareIds.length > 0 ? (
        <div className="sticky bottom-4 z-30 animate-fade-up">
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-edge-dark bg-paper px-4 py-3 shadow-lift">
            <p className="flex-1 text-xs text-ink-inverse">
              <span className="font-display font-semibold">{compareIds.length}</span> selected for comparison
              {compareIds.length < 2 ? <span className="text-ink-faint"> — pick one more</span> : null}
            </p>
            <Button
              size="sm"
              variant="secondary"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              Compare
            </Button>
            <button onClick={() => setCompareIds([])} className="rounded-full p-1.5 text-ink-faint hover:text-ink-inverse" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Filter modal */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Select value={filterDraft.city ?? ''} onChange={e => setFilterDraft(f => ({ ...f, city: e.target.value || undefined }))}>
                <option value="">Any</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={filterDraft.propertyType ?? ''} onChange={e => setFilterDraft(f => ({ ...f, propertyType: e.target.value || undefined }))}>
                <option value="">Any</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Min price (₹)">
              <Input type="number" min={0} value={filterDraft.minPrice ?? ''} onChange={e => setFilterDraft(f => ({ ...f, minPrice: e.target.value || undefined }))} />
            </Field>
            <Field label="Max price (₹)">
              <Input type="number" min={0} value={filterDraft.maxPrice ?? ''} onChange={e => setFilterDraft(f => ({ ...f, maxPrice: e.target.value || undefined }))} />
            </Field>
            <Field label="Bedrooms">
              <Select value={filterDraft.bedrooms ?? ''} onChange={e => setFilterDraft(f => ({ ...f, bedrooms: e.target.value || undefined }))}>
                <option value="">Any</option>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
              </Select>
            </Field>
            <Field label="Furnishing">
              <Select value={filterDraft.furnishing ?? ''} onChange={e => setFilterDraft(f => ({ ...f, furnishing: e.target.value || undefined }))}>
                <option value="">Any</option>
                {['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'].map(f => <option key={f} value={f}>{label(f)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Amenities">
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.map(a => {
                const active = (filterDraft.amenities ?? '').includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      const cur = (filterDraft.amenities ?? '').split(',').filter(Boolean);
                      const next = active ? cur.filter(x => x !== a) : [...cur, a];
                      setFilterDraft(f => ({ ...f, amenities: next.join(',') || undefined }));
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1 text-2xs transition-colors',
                      active ? 'border-brass-500 bg-brass-100 text-brass-800' : 'border-edge-light text-ink-muted hover:border-ink-faint',
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Parking required">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={filterDraft.parking === 'true'}
                onChange={e => setFilterDraft(f => ({ ...f, parking: e.target.checked ? 'true' : undefined }))}
                className="h-4 w-4 accent-brass-500"
              />
              Only show properties with parking
            </label>
          </Field>
          <div className="flex gap-2.5 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                setAiResults(null);
                setCriteria(null);
                setFilters(f => ({ ...f, ...filterDraft, page: '1' }));
                setFilterOpen(false);
              }}
            >
              Apply filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFilterDraft({});
                setFilters({ page: '1', limit: String(PAGE_SIZE) });
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Example queries modal */}
      <Modal open={exampleOpen} onClose={() => setExampleOpen(false)} title="Example queries" wide>
        <ul className="space-y-2">
          {EXAMPLE_QUERIES.map(q => (
            <li key={q}>
              <button
                onClick={() => {
                  setNlQuery(q);
                  setExampleOpen(false);
                }}
                className="w-full rounded-xl border border-edge-light px-4 py-3 text-left text-xs text-ink-soft transition-all hover:border-brass-400 hover:bg-brass-50"
              >
                “{q}”
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Compare modal */}
      <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} ids={compareIds} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-brass-100 px-2.5 py-1 font-mono text-2xs font-medium text-brass-800">{children}</span>;
}

function CompareModal({ open, onClose, ids }: { open: boolean; onClose: () => void; ids: string[] }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => propertyApi.list({ limit: '50' }).then(r => r.items.filter(p => ids.includes(p._id))),
    enabled: open && ids.length >= 2,
  });

  async function runSummary(): Promise<void> {
    setBusy(true);
    try {
      const r = await aiApi.compare(ids);
      setSummary(r.summary);
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  const rows: { key: string; render: (p: PropertyDoc) => string }[] = [
    { key: 'Price', render: p => formatPrice(p.price, p.listingType) },
    { key: 'Type', render: p => p.propertyType },
    { key: 'Location', render: p => `${p.locality}, ${p.city}` },
    { key: 'Area', render: p => `${p.carpetArea.toLocaleString('en-IN')} sq.ft` },
    { key: 'Beds/Baths', render: p => `${p.bedrooms} / ${p.bathrooms}` },
    { key: 'Parking', render: p => (p.parking ? 'Yes' : 'No') },
    { key: 'Furnishing', render: p => label(p.furnishing) },
    { key: 'Possession', render: p => p.possessionDate ?? '—' },
    { key: 'Amenities', render: p => p.amenities.slice(0, 4).join(', ') || '—' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare properties" wide>
      {!data ? (
        <CardGridSkeleton count={2} />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead>
                <tr className="border-b border-edge-light">
                  <th className="pb-2 pr-4 font-mono text-2xs uppercase tracking-wider text-ink-faint">Field</th>
                  {data.map(p => (
                    <th key={p._id} className="pb-2 pr-4 font-display text-xs font-semibold text-ink">{p.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="nums">
                {rows.map(row => (
                  <tr key={row.key} className="border-b border-edge-light/60 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-2xs uppercase tracking-wider text-ink-muted">{row.key}</td>
                    {data.map(p => (
                      <td key={p._id} className="py-2.5 pr-4 text-ink-soft">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-canvas p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-ink-muted">
                <Sparkles size={12} className="text-brass-600" /> AI summary
              </p>
              {!summary ? (
                <Button size="sm" variant="outline" onClick={runSummary} disabled={busy}>
                  {busy ? 'Thinking…' : 'Generate'}
                </Button>
              ) : null}
            </div>
            {summary ? <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{summary}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
