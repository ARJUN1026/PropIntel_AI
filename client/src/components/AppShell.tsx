import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, MessageSquareText, Heart, CalendarDays, Search,
  Users, BarChart3, LogOut, Menu, X, Sparkles, FolderKanban,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';
import { ChatWidget } from './ChatWidget';
import { cn } from '../lib/ui';
import type { Role } from '../types';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CUSTOMER'] },
  { to: '/browse', icon: Search, label: 'Find Property', roles: ['CUSTOMER'] },
  { to: '/assistant', icon: Sparkles, label: 'AI Assistant', roles: ['CUSTOMER', 'ADMIN'] },
  { to: '/saved', icon: Heart, label: 'Saved', roles: ['CUSTOMER', 'ADMIN'] },
  { to: '/visits', icon: CalendarDays, label: 'My Visits', roles: ['CUSTOMER'] },
  { to: '/agent-dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/leads', icon: Users, label: 'Leads', roles: ['ADMIN'] },
  { to: '/conversations', icon: MessageSquareText, label: 'Conversations', roles: ['ADMIN'] },
  { to: '/visits', icon: CalendarDays, label: 'Site Visits', roles: ['ADMIN'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN'] },
  { to: '/properties-admin', icon: FolderKanban, label: 'Properties', roles: ['ADMIN'] },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = NAV.filter(n => user && n.roles.includes(user.role));

  function handleLogout(): void {
    logout();
    navigate('/login');
  }

  const navList = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      {items.map(item => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150',
              isActive
                ? 'bg-surface/10 font-medium text-ink-inverse'
                : 'text-ink-faint hover:bg-surface/5 hover:text-ink-inverse',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
              <span>{item.label}</span>
              {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brass-400" /> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* ---- Sidebar (desktop) ---- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-paper px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-400 font-display text-sm font-bold text-paper">P</div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight text-ink-inverse">PropIntel</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">AI Suite</p>
          </div>
        </div>

        {navList}

        <div className="mt-4 rounded-xl border border-edge-dark bg-surface/5 p-3.5">
          <div className="flex items-center gap-2 text-brass-300">
            <Sparkles size={13} />
            <p className="font-mono text-[9px] uppercase tracking-[0.16em]">AI Copilot Ready</p>
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-ink-faint">
            {user?.role === 'CUSTOMER' ? 'Assistant learns your requirements as you chat.' : 'Copilot briefs you on today\u2019s priorities.'}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-edge-dark pt-4">
          <Avatar name={user?.name ?? '?'} size={34} dark />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink-inverse">{user?.name}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-brass-400">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface/10 hover:text-brick-100" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ---- Mobile drawer ---- */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-paper/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[270px] flex-col bg-paper px-4 py-6 animate-fade-up">
            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-400 font-display text-sm font-bold text-paper">P</div>
                <p className="font-display text-sm font-semibold text-ink-inverse">PropIntel</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-ink-faint" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {navList}
            <button onClick={handleLogout} className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-faint hover:bg-surface/5 hover:text-ink-inverse">
              <LogOut size={17} /> Sign out
            </button>
          </aside>
        </div>
      ) : null}

      {/* ---- Main column ---- */}
      <div className="flex min-h-[100dvh] flex-col lg:pl-[248px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-edge-light bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-ink-soft hover:bg-ink/5" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ink font-display text-[11px] font-bold text-brass-300">P</div>
            <p className="font-display text-sm font-semibold tracking-tight text-ink">PropIntel</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Avatar name={user?.name ?? '?'} size={28} />
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-ink-muted hover:bg-ink/5 lg:hidden" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </header>
        <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-edge-light bg-canvas/85 px-8 backdrop-blur-md lg:flex">
          <p className="font-mono text-2xs uppercase tracking-[0.18em] text-ink-faint">
            {items.find(i => location.pathname.startsWith(i.to))?.label ?? 'Overview'}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-2xs text-ink-faint">{user?.email}</span>
            <span className="h-1 w-1 rounded-full bg-brass-400" />
            <span className="font-mono text-2xs text-ink-muted">{user?.role}</span>
          </div>
          <Building2 size={14} className="ml-4 text-ink-faint" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Floating assistant popup — every page, every role */}
      <ChatWidget />
    </div>
  );
}
