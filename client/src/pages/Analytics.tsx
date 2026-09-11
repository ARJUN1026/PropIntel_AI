import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { analyticsApi, type FunnelPoint, type AgentRow, type SourceRow } from '../api';
import { Card, StatCard, EmptyState } from '../components/ui';
import { TrendArea, HBar, VBar } from '../components/Charts';
import { label } from '../lib/ui';

export function AnalyticsPage() {
  const overviewQuery = useQuery({ queryKey: ['overview'], queryFn: () => analyticsApi.overview() });
  const leadsQuery = useQuery({ queryKey: ['analytics-leads'], queryFn: () => analyticsApi.leads() });
  const propsQuery = useQuery({ queryKey: ['analytics-properties'], queryFn: () => analyticsApi.properties() });
  const agentsQuery = useQuery({ queryKey: ['analytics-agents'], queryFn: () => analyticsApi.agents() });
  const campaignsQuery = useQuery({ queryKey: ['analytics-campaigns'], queryFn: () => analyticsApi.campaigns() });
  const demandQuery = useQuery({ queryKey: ['analytics-demand'], queryFn: () => analyticsApi.demand() });

  const funnel: FunnelPoint[] = leadsQuery.data?.funnel ?? [];
  const agents: AgentRow[] = agentsQuery.data?.items ?? [];
  const sources: SourceRow[] = campaignsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1300px] space-y-8">
      <div>
        <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brass-600">Business intelligence</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
          <BarChart3 size={20} className="text-brass-600" /> Analytics
        </h1>
        <p className="mt-1 text-xs text-ink-muted">Funnels, sources, demand and agent performance — computed live from CRM data.</p>
      </div>

      {/* Overview stats */}
      {overviewQuery.data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
          <StatCard label="Properties" value={overviewQuery.data.properties} />
          <StatCard label="Customers" value={overviewQuery.data.customers} />
          <StatCard label="Agents" value={overviewQuery.data.agents} />
          <StatCard label="Leads" value={overviewQuery.data.leads} />
          <StatCard label="Hot leads" value={overviewQuery.data.hotLeads} accent />
          <StatCard label="Visits" value={overviewQuery.data.visits} />
          <StatCard label="Conversions" value={overviewQuery.data.conversions} />
          <StatCard label="Conv. rate" value={`${overviewQuery.data.conversionRate}%`} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Sales funnel</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Leads → qualified → visits → negotiation → converted</p>
          {leadsQuery.isLoading ? (
            <div className="mt-4 h-[220px] animate-shimmer rounded-xl bg-canvas" />
          ) : funnel.length > 0 ? (
            <div className="mt-4">
              <TrendArea data={funnel} dataKey="count" height={220} />
            </div>
          ) : (
            <EmptyState title="No funnel data" body="Leads must exist before the funnel renders." />
          )}
        </Card>

        {/* Temperature split */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Lead temperature</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Scoring engine classification across all leads</p>
          {leadsQuery.isLoading ? (
            <div className="mt-4 h-[220px] animate-shimmer rounded-xl bg-canvas" />
          ) : (leadsQuery.data?.byTemperature ?? []).length > 0 ? (
            <div className="mt-4">
              <VBar
                data={(leadsQuery.data?.byTemperature ?? []).map(t => ({ stage: label(t._id), count: t.count }))}
                xKey="stage"
                height={220}
              />
            </div>
          ) : (
            <EmptyState title="No data" body="Temperature buckets appear once leads are scored." />
          )}
        </Card>

        {/* Demand: locations */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Most requested locations</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">From lead requirements (spec §43)</p>
          {(demandQuery.data?.locations ?? []).length > 0 ? (
            <div className="mt-4">
              <HBar
                data={(demandQuery.data?.locations ?? []).map(l => ({ label: l._id, count: l.count }))}
                height={Math.max(200, (demandQuery.data?.locations.length ?? 0) * 34)}
              />
            </div>
          ) : (
            <EmptyState title="No demand data" body="Leads with preferred locations feed this chart." />
          )}
        </Card>

        {/* Demand: budgets */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Budget distribution</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Customer budget ceilings (spec §44)</p>
          {(demandQuery.data?.budgets ?? []).length > 0 ? (
            <div className="mt-4">
              <VBar
                data={(demandQuery.data?.budgets ?? []).map(b => ({ stage: b.label, count: b.count }))}
                xKey="stage"
                height={220}
              />
            </div>
          ) : (
            <EmptyState title="No budget data" body="Leads with extracted budgets feed this chart." />
          )}
        </Card>

        {/* Lead sources */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Lead sources</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Volume and conversion by marketing channel (spec §45–46)</p>
          {sources.length === 0 ? (
            <EmptyState title="No campaign data" body="Lead sources appear once leads exist." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-xs nums">
                <thead>
                  <tr className="border-b border-edge-light">
                    {['Source', 'Leads', 'Qualified', 'Converted', 'Conv. rate'].map(h => (
                      <th key={h} className="pb-2.5 pr-4 font-mono text-2xs font-medium uppercase tracking-wider text-ink-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sources.map(s => (
                    <tr key={s.source} className="border-b border-edge-light/60 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-ink">{label(s.source)}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{s.leads}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{s.qualified}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{s.converted}</td>
                      <td className="py-2.5 pr-4">
                        <span className={s.conversionRate >= 10 ? 'font-semibold text-sage-700' : 'text-ink-soft'}>{s.conversionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Agent performance */}
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-ink">Agent performance</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Admins see all agents; leads, visits, conversions (spec §47)</p>
          {agents.length === 0 ? (
            <EmptyState title="No agent data" body="Agent metrics appear once leads are assigned." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs nums">
                <thead>
                  <tr className="border-b border-edge-light">
                    {['Agent', 'Leads', 'Qualified', 'Visits', 'Conversions', 'Conv. rate'].map(h => (
                      <th key={h} className="pb-2.5 pr-4 font-mono text-2xs font-medium uppercase tracking-wider text-ink-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a.agentId} className="border-b border-edge-light/60 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-ink">{a.name}</p>
                        <p className="text-2xs text-ink-faint">{a.email}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-soft">{a.leads}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{a.qualified}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{a.visits}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{a.conversions}</td>
                      <td className="py-2.5 pr-4">
                        <span className={a.conversionRate >= 10 ? 'font-semibold text-sage-700' : 'text-ink-soft'}>{a.conversionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Property demand by city */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-sm font-semibold text-ink">Inventory by city</h2>
          <p className="mt-0.5 text-2xs text-ink-muted">Average asking price per city (spec §43)</p>
          {(propsQuery.data?.byCity ?? []).length > 0 ? (
            <div className="mt-4">
              <VBar
                data={(propsQuery.data?.byCity ?? []).map(c => ({ stage: c._id, count: c.count }))}
                xKey="stage"
                height={240}
              />
            </div>
          ) : (
            <EmptyState title="No properties" body="Add properties to see city distribution." />
          )}
        </Card>
      </div>
    </div>
  );
}
