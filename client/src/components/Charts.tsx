import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { formatPrice } from '../lib/ui';

const AXIS = { fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#9A9CA1' };

const PALETTE = ['#C9AD66', '#4A7A5E', '#B4463C', '#6D6F73', '#8A652C', '#35593F', '#9A9CA1', '#D6C28E', '#A87E35', '#3F4043'];

function ChartTooltip({ active, payload, label: lbl }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-edge-light bg-surface px-3.5 py-2.5 shadow-lift">
      <p className="font-mono text-2xs uppercase tracking-wider text-ink-muted">{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-1 font-display text-sm font-semibold text-ink" style={{ color: p.color }}>
          {typeof p.value === 'number' && p.name === 'avgPrice' ? formatPrice(p.value) : `${p.value}`}
          <span className="ml-1 font-body text-2xs font-normal text-ink-muted">{p.name === 'avgPrice' ? 'avg price' : p.name}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendArea({ data, dataKey = 'count', height = 220, color = '#C9AD66' }: {
  data: { stage: string; count: number }[] | Record<string, unknown>[];
  dataKey?: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data as object[]} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke="#E7E7E3" vertical={false} />
        <XAxis dataKey="stage" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#D6C28E', strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace('#', '')})`} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, dataKey = 'count', height = 260 }: { data: Record<string, unknown>[]; dataKey?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#E7E7E3" horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={104} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,173,102,0.08)' }} />
        <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({ data, xKey, dataKey = 'count', height = 240 }: { data: Record<string, unknown>[]; xKey: string; dataKey?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#E7E7E3" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} interval={0} angle={-18} dy={8} height={44} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,173,102,0.08)' }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} barSize={22} fill="#1B1C1E" />
      </BarChart>
    </ResponsiveContainer>
  );
}
