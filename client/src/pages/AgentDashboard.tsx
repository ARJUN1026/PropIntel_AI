import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, CalendarDays, Users, TrendingUp, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { leadApi, analyticsApi, visitApi, aiApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { Card, StatCard, EmptyState, ListSkeleton, TempBadge, StatusBadge } from '../components/ui';
import { timeAgo, label, cn } from '../lib/ui';

export function AgentDashboard() {
  const { user } = useAuth();

  const prioritiesQuery = useQuery({ queryKey: ['lead-priorities'], queryFn: () => leadApi.priorities() });
  const overviewQuery = useQuery({ queryKey: ['overview'], queryFn: () => analyticsApi.overview() });
  const visitsQuery = useQuery({ queryKey: ['visits'], queryFn: () => visitApi.list() });
  const convQuery = useQuery({ queryKey: ['conversations'], queryFn: () => aiApi.conversations() });

  const buckets = prioritiesQuery.data?.buckets;
  const hotLeads = buckets?.HIGH ?? [];
  const upcomingVisits = (visitsQuery.data?.items ?? [])
    .filter(v => ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(v.status))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">Copilot</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
          Today's priorities, {user?.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-xs text-ink-muted">
          Full pipeline ranked by the scoring engine — hot leads, overdue follow-ups and upcoming visits.
        </p>
      </div>

      {/* Stat cards */}
      {overviewQuery.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total leads" value={overviewQuery.data.leads} hint="All-time" />
          <StatCard label="Hot leads" value={overviewQuery.data.hotLeads} hint="Score 80+" accent />
          <StatCard label="Site visits" value={overviewQuery.data.visits} hint="All statuses" />
          <StatCard label="Conversion" value={`${overviewQuery.data.conversionRate}%`} hint={`${overviewQuery.data.conversions} converted`} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Card key={i} className="h-[104px] animate-shimmer">{''}</Card>)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Priority queue */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Flame size={15} className="text-brick-500" /> Priority queue
            </h2>
            <Link to="/leads" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">All leads</Link>
          </div>

          {prioritiesQuery.isLoading ? (
            <ListSkeleton rows={5} />
          ) : !buckets || (hotLeads.length === 0 && (buckets.MEDIUM.length === 0) && (buckets.LOW.length === 0)) ? (
            <EmptyState title="No leads yet" body="Leads captured from the assistant and inquiries appear here ranked by score." />
          ) : (
            <div className="space-y-6">
              {[
                { key: 'HIGH', title: 'High priority', icon: Flame, tone: 'text-brick-500' },
                { key: 'MEDIUM', title: 'Medium priority', icon: Clock, tone: 'text-brass-600' },
                { key: 'LOW', title: 'Low priority', icon: Users, tone: 'text-ink-faint' },
              ].map(b => {
                const rows = buckets[b.key as keyof typeof buckets] ?? [];
                if (rows.length === 0) return null;
                return (
                  <div key={b.key}>
                    <p className={cn('mb-2.5 flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider', b.tone)}>
                      <b.icon size={12} /> {b.title} · {rows.length}
                    </p>
                    <div className="space-y-2.5">
                      {rows.slice(0, 4).map(l => {
                        return (
                          <Link key={l._id} to={`/leads/${l._id}`} className="block">
                            <Card className="flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                              {/* Score ring */}
                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                                <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E7E7E3" strokeWidth="3" />
                                  <circle
                                    cx="18" cy="18" r="15.5" fill="none"
                                    stroke={l.leadScore >= 80 ? '#B4463C' : l.leadScore >= 60 ? '#C9AD66' : '#9A9CA1'}
                                    strokeWidth="3"
                                    strokeDasharray={`${(l.leadScore / 100) * 97.4} 97.4`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="font-display text-xs font-bold text-ink nums">{l.leadScore}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                                <p className="mt-0.5 text-2xs text-ink-muted">
                                  {label(l.intent)} · {l.propertyType || 'Any type'} · {timeAgo(l.updatedAt)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <TempBadge temperature={l.leadTemperature} />
                                <ArrowRight size={14} className="text-ink-faint" />
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Side rail */}
        <div className="space-y-6">
          {/* Upcoming visits */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <CalendarDays size={15} className="text-brass-600" /> Upcoming visits
              </h2>
              <Link to="/visits" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">Manage</Link>
            </div>
            {upcomingVisits.length === 0 ? (
              <EmptyState title="No upcoming visits" body="Confirmed and requested visits will show here." />
            ) : (
              <div className="space-y-2.5">
                {upcomingVisits.map(v => {
                  const p = typeof v.propertyId === 'object' ? v.propertyId : null;
                  const customer = typeof v.customerId === 'object' ? v.customerId : null;
                  return (
                    <Card key={v._id} className="p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-2xs text-ink-muted nums">{v.date} · {v.time}</span>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-ink">{p?.title ?? 'Visit'}</p>
                      {customer ? <p className="text-2xs text-ink-muted">Customer: {customer.name}</p> : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent conversations */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <TrendingUp size={15} className="text-brass-600" /> Latest conversations
              </h2>
              <Link to="/conversations" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">Open</Link>
            </div>
            {(convQuery.data?.items ?? []).length === 0 ? (
              <EmptyState title="No conversations" body="Customer chats routed to your team appear here." />
            ) : (
              <div className="space-y-2.5">
                {(convQuery.data?.items ?? []).slice(0, 4).map(c => (
                  <Link key={c._id} to="/conversations" className="block">
                    <Card className="flex items-center gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">
                          {typeof c.customerId === 'object' ? c.customerId.name : 'Customer'}
                        </p>
                        <p className="truncate text-2xs text-ink-muted">{c.title}</p>
                      </div>
                      <span className="shrink-0 font-mono text-2xs text-ink-faint">{timeAgo(c.updatedAt)}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Copilot hint */}
          <Card className="border-brass-200/70 bg-brass-50 p-4">
            <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-brass-700">
              <AlertTriangle size={12} /> Copilot note
            </p>
            <p className="mt-2 text-2xs leading-relaxed text-ink-soft">
              Lead scores update automatically on every message, requirement change and visit request. Work the queue top-down.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
