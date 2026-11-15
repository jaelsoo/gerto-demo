import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { NAV_SECTIONS, TAB_ITEMS } from '../../constants/navigation';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import SyncIndicator from './SyncIndicator';
import { Avatar, cx } from '../ui/primitives';

export function Logo({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-teal to-petrol shadow-sm">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden>
          <path d="M44 22a14 14 0 1 0 2 14H33" fill="none" stroke="#DDD8C4" strokeWidth="6" strokeLinecap="round" />
          <circle cx="46" cy="36" r="3" fill="#A3C9A8" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[17px] font-bold text-ink">Gerto</span>
          <span className="block text-[11px] font-medium text-muted">ROAS Transfer</span>
        </span>
      )}
    </span>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-card/70 text-ink hover:bg-surface"
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line/70 bg-card/70 backdrop-blur-xl md:flex lg:w-[264px]">
      <div className="px-5 pb-4 pt-5">
        <Logo />
      </div>
      <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Navegação principal">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition',
                        isActive ? 'bg-primary text-white shadow-sm' : 'text-ink/85 hover:bg-surface',
                      )
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line/70 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user?.name} className="h-9 w-9 text-[13px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-[11.5px] text-muted">{user?.title}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink" aria-label="Sair" title="Sair">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { user } = useAuth();
  const { offline } = useData();
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      {offline && (
        <div className="bg-red-500 px-4 py-1 text-center text-[12px] font-medium text-white">Modo offline (simulado) — alterações não serão sincronizadas.</div>
      )}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-8">
        <Link to="/" className="md:hidden" aria-label="Início">
          <Logo compact />
        </Link>
        <div className="flex-1" />
        <SyncIndicator />
        <ThemeToggle />
        <Link to="/configuracoes" className="md:hidden" aria-label="Configurações e perfil">
          <Avatar name={user?.name} className="h-9 w-9 text-[13px]" />
        </Link>
      </div>
    </header>
  );
}

function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/80 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TAB_ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cx('flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10.5px] font-medium', active ? 'text-primary dark:text-mint' : 'text-muted')}
              >
                <Icon className="h-[23px] w-[23px]" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-[248px] lg:pl-[264px]">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-7">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}
