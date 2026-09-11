import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Phone, Mail, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { leadApi, errMessage } from '../api';
import type { LeadDoc } from '../types';
import { Button, Card, EmptyState, Select, Skeleton, TempBadge, StatusBadge, toast } from '../components/ui';
import { formatPrice, label, timeAgo, cn } from '../lib/ui';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'NURTURE'];

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scoring, setScoring] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.get(id!),
    enabled: Boolean(id),
  });

  async function rescore(): Promise<void> {
    if (!id) return;
    setScoring(true);
    try {
      const r = await leadApi.score(id);
      toast(`Score ${r.score} — ${r.temperature}`);
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (err) {
      toast(errMessage(err), 'err');
    } finally {
      setScoring(false);
    }
  }

  async function setStatus(status: string): Promise<void> {
    if (!id) return;
    try {
      await leadApi.update(id, { status });
      toast(`Status → ${label(status)}`);
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (err) {
      toast(errMessage(err), 'err');
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-5">
        <Skeleton className="h-7 w-36" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Lead not found"
        body="It may have been merged or deleted."
        action={<Button variant="outline" onClick={() => navigate('/leads')}>Back to leads</Button>}
      />
    );
  }

  const lead: LeadDoc = data.lead;
  const customer = typeof lead.customerId === 'object' ? lead.customerId : null;
  const agent = typeof lead.assignedAgent === 'object' ? lead.assignedAgent : null;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/leads')} className="flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft size={14} /> All leads
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-semibold tracking-tight text-ink">
              {lead.name}
              <TempBadge temperature={data.temperature} />
              <StatusBadge status={lead.status} />
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              {label(lead.intent)} · Source: {label(lead.source)} · Updated {timeAgo(lead.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Select value={lead.status} onChange={e => void setStatus(e.target.value)} className="w-44">
              {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Button variant="outline" size="sm" onClick={() => void rescore()} disabled={scoring}>
              <RefreshCw size={13} className={cn(scoring && 'animate-spin')} /> Re-score
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Score explanation */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-ink">Lead score</h2>
              <Sparkles size={15} className="text-brass-600" />
            </div>
            <div className="mt-4 flex items-end gap-3">
              <p className="font-display text-4xl font-semibold tracking-tight text-ink nums">{data.scoreBreakdown.score}</p>
              <p className="pb-1.5 font-mono text-2xs text-ink-faint">/ 100 · {data.temperature}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  data.scoreBreakdown.score >= 80 ? 'bg-brick-500' : data.scoreBreakdown.score >= 60 ? 'bg-brass-500' : 'bg-ink/25',
                )}
                style={{ width: `${data.scoreBreakdown.score}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2 border-t border-edge-light pt-4">
              {data.scoreBreakdown.reasons.map(r => (
                <li key={r} className="flex items-start gap-2 text-xs text-ink-soft">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-sage-500" /> {r}
                </li>
              ))}
            </ul>
          </Card>

          {/* Next action */}
          <Card className="border-brass-200/70 bg-brass-50 p-5">
            <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-brass-700">
              <Sparkles size={12} /> Recommended next action
            </p>
            <p className="mt-2 font-display text-sm font-semibold text-ink">{label(data.nextAction.action)}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{data.nextAction.reason}</p>
          </Card>

          {/* Requirements */}
          <Card className="p-6">
            <h2 className="font-display text-sm font-semibold text-ink">Requirements</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs sm:grid-cols-3">
              {[
                ['Property type', lead.propertyType || 'Any'],
                ['Budget', lead.budgetMax ? `≤ ${formatPrice(lead.budgetMax)}` : lead.budgetMin ? `≥ ${formatPrice(lead.budgetMin)}` : 'Open'],
                ['Locations', lead.preferredLocations.length > 0 ? lead.preferredLocations.join(', ') : '—'],
                ['Timeline', lead.timeline ?? '—'],
                ['Engagement', `${lead.engagementCount} interactions`],
                ['Sentiment', label(lead.sentiment)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-2xs uppercase tracking-wider text-ink-faint">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.requirements.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-edge-light pt-4">
                {lead.requirements.map(r => (
                  <span key={r} className="rounded-full bg-canvas px-2.5 py-1 text-2xs text-ink-soft">{r}</span>
                ))}
              </div>
            ) : null}
          </Card>

          {/* Interested properties */}
          {lead.interestedProperties.length > 0 ? (
            <Card className="p-6">
              <h2 className="font-display text-sm font-semibold text-ink">Interested properties</h2>
              <div className="mt-3.5 space-y-2">
                {lead.interestedProperties.map(p => {
                  if (typeof p === 'string') return null;
                  return (
                    <Link
                      key={p._id}
                      to={`/property/${p._id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-edge-light px-3.5 py-2.5 transition-colors hover:border-brass-400"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-ink">{p.title}</p>
                        <p className="text-2xs text-ink-muted">{p.locality}, {p.city}</p>
                      </div>
                      <span className="shrink-0 font-mono text-2xs text-ink nums">{formatPrice(p.price)}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </div>

        {/* Right column: contact + pipeline */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold text-ink">Customer</h2>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2.5 text-xs text-ink-soft">
                <Phone size={13} className="text-ink-faint" /> {customer?.phone ?? lead.phone ?? '—'}
              </p>
              <p className="flex items-center gap-2.5 text-xs text-ink-soft">
                <Mail size={13} className="text-ink-faint" /> {customer?.email ?? '—'}
              </p>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-edge-light pt-4 text-2xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Assigned agent</span>
                <span className="font-medium text-ink-soft">{agent?.name ?? 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Last contact</span>
                <span className="font-medium text-ink-soft">{timeAgo(lead.lastContactedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Next follow-up</span>
                <span className="font-medium text-ink-soft">
                  {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold text-ink">Pipeline</h2>
            <ol className="mt-4 space-y-0">
              {STATUSES.map(s => {
                const currentIndex = STATUSES.indexOf(lead.status);
                const idx = STATUSES.indexOf(s);
                const done = currentIndex >= 0 && idx <= currentIndex && lead.status !== 'LOST';
                const isCurrent = s === lead.status;
                return (
                  <li key={s} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {isCurrent ? (
                        <CheckCircle2 size={15} className="text-brass-600" />
                      ) : (
                        <Circle size={15} className={cn(done ? 'text-sage-500' : 'text-ink-faint/40')} fill={done ? 'currentColor' : 'none'} />
                      )}
                      {idx < STATUSES.length - 1 ? <span className={cn('h-6 w-px', done ? 'bg-sage-500/40' : 'bg-edge-light')} /> : null}
                    </div>
                    <span className={cn('pb-1 text-xs', isCurrent ? 'font-semibold text-ink' : done ? 'text-ink-soft' : 'text-ink-faint')}>
                      {label(s)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
