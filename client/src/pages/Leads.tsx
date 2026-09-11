import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter } from 'lucide-react';
import { leadApi } from '../api';
import type { LeadDoc, LeadStatus, LeadTemperature } from '../types';
import { Button, Card, EmptyState, Input, ListSkeleton, Select, TempBadge, StatusBadge } from '../components/ui';
import { formatPrice, label, cn } from '../lib/ui';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'NURTURE'];
const TEMPERATURES: LeadTemperature[] = ['HOT', 'WARM', 'NURTURE', 'COLD'];

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [temperature, setTemperature] = useState('');
  const [minScore, setMinScore] = useState('');
  const [page, setPage] = useState('1');

  const params: Record<string, string> = { page, limit: '20' };
  if (search) params.search = search;
  if (status) params.status = status;
  if (temperature) params.temperature = temperature;
  if (minScore) params.minScore = minScore;

  const { data, isLoading } = useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadApi.list(params),
  });

  const items: LeadDoc[] = data?.items ?? [];
  const hasFilters = Boolean(search || status || temperature || minScore);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">CRM</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
            <Users size={20} className="text-brass-600" /> Leads
          </h1>
          <p className="mt-1 text-xs text-ink-muted">Ranked by the AI scoring engine — work top-down.</p>
        </div>
        <p className="font-mono text-2xs text-ink-faint nums">{data?.total ?? 0} leads</p>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage('1');
              }}
              placeholder="Search by name or phone…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage('1');
              }}
              className="w-40"
            >
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Select
              value={temperature}
              onChange={e => {
                setTemperature(e.target.value);
                setPage('1');
              }}
              className="w-36"
            >
              <option value="">All temps</option>
              {TEMPERATURES.map(t => <option key={t} value={t}>{label(t)}</option>)}
            </Select>
            <Select
              value={minScore}
              onChange={e => {
                setMinScore(e.target.value);
                setPage('1');
              }}
              className="w-36"
            >
              <option value="">Any score</option>
              <option value="80">80+</option>
              <option value="60">60+</option>
              <option value="40">40+</option>
            </Select>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setTemperature('');
                  setMinScore('');
                  setPage('1');
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {hasFilters ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-edge-light pt-3 font-mono text-2xs text-ink-faint">
            <Filter size={11} /> Filters active — {data?.total ?? 0} matching
          </p>
        ) : null}
      </Card>

      {/* List */}
      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : items.length === 0 ? (
        <EmptyState title="No leads found" body="Adjust the filters, or capture leads by chatting with the assistant as a customer." />
      ) : (
        <div className="space-y-2.5">
          {items.map((l, i) => {
            const customer = typeof l.customerId === 'object' ? l.customerId : null;
            const agent = typeof l.assignedAgent === 'object' ? l.assignedAgent : null;
            return (
              <Link key={l._id} to={`/leads/${l._id}`} className="block">
                <Card
                  className={cn(
                    'flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center',
                    i === 0 && !hasFilters ? 'border-brass-200/80' : '',
                  )}
                >
                  {/* Score */}
                  <div className="flex w-14 shrink-0 flex-col items-center">
                    <span
                      className={cn(
                        'font-display text-xl font-bold nums',
                        l.leadScore >= 80 ? 'text-brick-500' : l.leadScore >= 60 ? 'text-brass-600' : 'text-ink-faint',
                      )}
                    >
                      {l.leadScore}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">score</span>
                  </div>

                  <div className="h-10 w-px bg-edge-light max-sm:hidden" />

                  {/* Identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                      <TempBadge temperature={l.leadTemperature} />
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-ink-muted">
                      {customer?.phone ?? l.phone ?? '—'} · {label(l.intent)} · {l.propertyType || 'Any type'}
                      {l.preferredLocations.length > 0 ? ` · ${l.preferredLocations.join(', ')}` : ''}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-2xs text-ink-soft nums">
                      {l.budgetMax ? `≤ ${formatPrice(l.budgetMax)}` : l.budgetMin ? `≥ ${formatPrice(l.budgetMin)}` : 'Budget open'}
                    </p>
                    <p className="mt-0.5 text-2xs text-ink-faint">
                      {agent ? `Agent: ${agent.name}` : 'Unassigned'}
                      {l.source ? ` · ${label(l.source)}` : ''}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={Number(page) <= 1}
            onClick={() => setPage(p => String(Number(p) - 1))}
          >
            Previous
          </Button>
          <span className="font-mono text-2xs text-ink-muted nums">Page {data?.page} of {data?.pages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={Number(page) >= (data?.pages ?? 1)}
            onClick={() => setPage(p => String(Number(p) + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
