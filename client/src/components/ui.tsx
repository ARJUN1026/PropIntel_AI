import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn, label, temperatureTone, statusTone, initials, type Tone } from '../lib/ui';

/* ---------- Button ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-body font-medium transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';
  const variants: Record<string, string> = {
    primary: 'bg-ink text-ink-inverse hover:bg-black/85',
    secondary: 'bg-brass-500 text-paper hover:bg-brass-600',
    outline: 'border border-edge-light bg-surface text-ink hover:border-ink-faint',
    ghost: 'text-ink-soft hover:bg-ink/5',
    danger: 'bg-brick-500 text-white hover:bg-brick-700',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-7 text-sm tracking-wide',
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}

/* ---------- Badge ---------- */

const TONE_CLASSES: Record<Tone, string> = {
  brass: 'bg-brass-100 text-brass-800',
  sage: 'bg-sage-100 text-sage-700',
  brick: 'bg-brick-100 text-brick-700',
  info: 'bg-ink/5 text-ink-soft',
  neutral: 'bg-ink/5 text-ink-muted',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-2xs font-medium uppercase tracking-wider', TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}

export function TempBadge({ temperature }: { temperature: string }) {
  return <Badge tone={temperatureTone(temperature)}>{label(temperature)}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{label(status)}</Badge>;
}

/* ---------- Card ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-edge-light bg-surface shadow-card', className)}>{children}</div>;
}

/* ---------- Inputs ---------- */

export function Field({ label: lbl, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-ink-muted">{lbl}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-brick-500">{error}</span> : null}
    </label>
  );
}

const INPUT_BASE =
  'w-full rounded-xl border border-edge-light bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT_BASE, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(INPUT_BASE, 'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D6F73\' stroke-width=\'2.5\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9', props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(INPUT_BASE, 'min-h-[90px] resize-y', props.className)} />;
}

/* ---------- Modal ---------- */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-paper/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div
        className={cn(
          'max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-edge-light bg-surface p-6 shadow-lift animate-fade-up sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Skeletons ---------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-shimmer rounded-xl', className)}
      style={{
        backgroundImage: 'linear-gradient(100deg, rgba(27,28,30,0.05) 40%, rgba(27,28,30,0.1) 50%, rgba(27,28,30,0.05) 60%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-edge-light bg-surface">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="space-y-2.5 p-5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge-light bg-surface/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-edge-light bg-canvas font-mono text-sm text-ink-faint">—</div>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ---------- Stat card ---------- */

export function StatCard({ label: lbl, value, hint, accent }: { label: string; value: string | number; hint?: string; accent?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-2xs font-medium uppercase tracking-wider text-ink-muted">{lbl}</p>
      <p className={cn('mt-2 font-display text-2xl font-semibold tracking-tight', accent ? 'text-brass-600' : 'text-ink')}>{value}</p>
      {hint ? <p className="mt-1 text-2xs text-ink-faint">{hint}</p> : null}
    </Card>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ name, size = 36, dark }: { name: string; size?: number; dark?: boolean }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-display font-semibold', dark ? 'bg-brass-400/15 text-brass-300' : 'bg-ink/5 text-ink-soft')}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- Toast (lightweight) ---------- */

type ToastMsg = { id: number; text: string; kind: 'ok' | 'err' };
let pushToastFn: ((text: string, kind?: 'ok' | 'err') => void) | null = null;

export function toast(text: string, kind: 'ok' | 'err' = 'ok'): void {
  pushToastFn?.(text, kind);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    pushToastFn = (text, kind = 'ok') => {
      const id = ++seq.current;
      setItems(prev => [...prev, { id, text, kind }]);
      window.setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3600);
    };
    return () => {
      pushToastFn = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {items.map(t => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto w-full rounded-xl px-4 py-3 text-xs font-medium shadow-lift animate-fade-up',
            t.kind === 'ok' ? 'bg-ink text-ink-inverse' : 'bg-brick-500 text-white',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
