import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button, Field, Input, toast } from '../components/ui';
import { errMessage } from '../api';
import { cn } from '../lib/ui';

function AuthLayout({ children, side }: { children: ReactNode; side: 'login' | 'register' }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Form side */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Editorial side */}
      <div className="relative hidden overflow-hidden bg-black lg:block">
        <img
          src="/images/login.jpg"
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-400 font-display text-base font-bold text-paper">P</div>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight text-ink-inverse">PropIntel AI</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">Property Intelligence</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="font-mono text-2xs uppercase tracking-[0.22em] text-brass-400">
              {side === 'login' ? 'Sign in' : 'Create account'}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink-inverse">
              Every enquiry becomes a scored, prioritised lead.
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-ink-faint">
              Describe what you need in plain language — the assistant extracts your requirements, matches properties
              with a 0–100 score, and routes you to the right agent. Sales teams see every lead ranked, with reasons.
            </p>
            <div className="mt-8 flex gap-8">
              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-faint">Search</p>
                <p className="mt-1 font-display text-sm font-medium text-ink-inverse">Natural language</p>
              </div>
              <div className="w-px bg-edge-dark" />
              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-faint">Scoring</p>
                <p className="mt-1 font-display text-sm font-medium text-ink-inverse">Explainable</p>
              </div>
              <div className="w-px bg-edge-dark" />
              <div>
                <p className="font-mono text-2xs uppercase tracking-wider text-ink-faint">Routing</p>
                <p className="mt-1 font-display text-sm font-medium text-ink-inverse">Role-based</p>
              </div>
            </div>
          </div>

          <p className="font-mono text-2xs text-ink-faint">PropIntel AI · Demo workspace</p>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      toast('Welcome back');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout side="login">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Sign in</h2>
      <p className="mt-1.5 text-xs text-ink-muted">Use a demo account or your registered email.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { role: 'Admin', email: 'admin@propintel.ai', pw: 'Admin@123' },
          { role: 'Customer', email: 'rahul@example.com', pw: 'Customer@123' },
        ].map(acc => (
          <button
            key={acc.role}
            type="button"
            onClick={() => {
              setEmail(acc.email);
              setPassword(acc.pw);
            }}
            className="rounded-xl border border-edge-light bg-surface px-2 py-2.5 text-center transition-all hover:border-brass-400 hover:shadow-card"
          >
            <span className="block font-mono text-2xs uppercase tracking-wider text-ink-muted">{acc.role}</span>
            <span className="mt-0.5 block font-display text-xs font-semibold text-ink">Use demo</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </Field>
        {error ? <p className="rounded-lg bg-brick-100 px-3 py-2 text-xs text-brick-700">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={15} />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        No account?{' '}
        <Link to="/register" state={location.state} className="font-medium text-ink underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  function set<K extends keyof typeof form>(key: K, value: string): void {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      toast('Account created — welcome');
      navigate('/');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const roleCards: { value: string; title: string; body: string }[] = [
    { value: 'CUSTOMER', title: 'Customer', body: 'Search, save, compare, book visits' },
    { value: 'ADMIN', title: 'Admin / Sales', body: 'Leads, visits, analytics, inventory' },
  ];

  return (
    <AuthLayout side="register">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Create account</h2>
      <p className="mt-1.5 text-xs text-ink-muted">Pick your role — the workspace adapts to it.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {roleCards.map(rc => (
          <button
            key={rc.value}
            type="button"
            onClick={() => set('role', rc.value)}
            className={cn(
              'rounded-xl border px-2 py-3 text-left transition-all',
              form.role === rc.value ? 'border-brass-500 bg-brass-50 ring-2 ring-brass-400/30' : 'border-edge-light bg-surface hover:border-ink-faint',
            )}
          >
            <span className="block font-display text-xs font-semibold text-ink">{rc.title}</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-ink-muted">{rc.body}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full name">
          <Input required minLength={2} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Aarav Kapoor" />
        </Field>
        <Field label="Email">
          <Input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="98xxxxxxxx" />
        </Field>
        <Field label="Password">
          <Input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 characters" />
        </Field>
        {error ? <p className="rounded-lg bg-brick-100 px-3 py-2 text-xs text-brick-700">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'} <ArrowRight size={15} />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
