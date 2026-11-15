import { Link } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { MORE_ITEMS } from '../constants/navigation';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import { Avatar, Card } from '../components/ui/primitives';

/** Tela "Mais" do smartphone: acesso aos módulos secundários, mantendo a hierarquia da Sidebar. */
export default function More() {
  const { user, logout } = useAuth();
  return (
    <div>
      <PageHeader title="Mais" />
      <Card className="mb-6 flex items-center gap-3 p-4">
        <Avatar name={user?.name} className="h-12 w-12 text-[16px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-[13px] text-muted">
            {user?.title} · {user?.email}
          </p>
        </div>
      </Card>
      <Card className="divide-y divide-line/70 overflow-hidden">
        {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="list-row">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-[15px] text-ink">{label}</span>
            <ChevronRight className="h-5 w-5 text-muted/50" />
          </Link>
        ))}
      </Card>
      <Card className="mt-6 overflow-hidden">
        <button onClick={logout} className="list-row w-full text-left text-red-600 dark:text-red-400">
          <LogOut className="h-5 w-5" />
          <span className="text-[15px] font-medium">Sair</span>
        </button>
      </Card>
    </div>
  );
}
