import { Database, ExternalLink, Info, LogOut, Moon, RotateCcw, Sun, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Avatar, Button, Card, Segmented, Toggle } from '../components/ui/primitives';

const LIMITS = [
  'Autenticação e token JWT são simulados — não há segurança real.',
  'Os dados ficam no localStorage do navegador, que não é um banco de dados seguro.',
  'A sincronização em tempo real ocorre apenas entre abas do mesmo navegador (evento storage).',
  'A assinatura eletrônica é demonstrativa, sem certificação nem validade jurídica.',
  'O painel contábil não integra sistemas fiscais nem emite notas oficiais.',
  'O compartilhamento via WhatsApp depende da ação do usuário; não há envio automático.',
];

export default function Settings() {
  const { user, session, logout } = useAuth();
  const { db, net, setNetwork, actions } = useData();
  const { theme, setTheme } = useTheme();

  // Ferramenta de demonstração (fora dos casos de uso): restaura o seed original.
  const reset = () => {
    if (window.confirm('Restaurar os dados de demonstração? Todas as alterações locais serão descartadas.')) actions.resetDemo();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Configurações" />

      <h2 className="section-title">Conta</h2>
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} className="h-12 w-12 text-[16px]" />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-ink">{user?.name}</p>
            <p className="text-[13px] text-muted">
              {user?.role} · {user?.title}
            </p>
            <p className="text-[13px] text-muted">{user?.email}</p>
          </div>
        </div>
        {session?.payload && (
          <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-[12px] text-muted">
            Sessão (JWT simulado) válida até {formatDateTime(new Date(session.payload.exp * 1000).toISOString())}
          </p>
        )}
        <Button variant="danger" icon={LogOut} className="mt-4 w-full" onClick={logout}>
          Sair
        </Button>
      </Card>

      <h2 className="section-title">Aparência</h2>
      <Card className="mb-6 p-4">
        <Segmented
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: '☀︎ Claro' },
            { value: 'dark', label: '☾ Escuro' },
          ]}
        />
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
          {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} O tema também pode ser alternado pelo botão no cabeçalho.
        </p>
      </Card>

      <h2 className="section-title">Rede e sincronização (UC09)</h2>
      <Card className="mb-6 space-y-4 p-4">
        <Toggle id="cfg-offline" checked={net.offline} onChange={(v) => setNetwork({ offline: v })} label="Simular Offline" description="Bloqueia requisições e exibe as mensagens de falha de conexão." />
        <Toggle id="cfg-sync" checked={net.syncFail} onChange={(v) => setNetwork({ syncFail: v })} label="Simular falha do servidor" description="Grava localmente e alerta que outros dispositivos podem estar desatualizados." />
        <p className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-[12px] text-muted">
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" /> Para ver a sincronização em tempo real, abra o Gerto em duas abas e altere um registro em uma delas.
        </p>
      </Card>

      <h2 className="section-title">Dados de demonstração</h2>
      <Card className="mb-6 p-4">
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <Database className="h-4 w-4" /> {db.services.length} serviços · {db.vehicles.length} veículos · {db.drivers.length} motoristas · {db.clients.length} clientes · {db.transactions.length} lançamentos · {db.contracts.length} contratos
        </p>
        <p className="mt-1 text-[12px] text-muted">Base criada em {formatDateTime(db.seededAt)} · última alteração {formatDateTime(db.updatedAt)}</p>
        <Button variant="outline" icon={RotateCcw} className="mt-4" onClick={reset}>
          Restaurar dados de demonstração
        </Button>
      </Card>

      <h2 className="section-title">Sobre</h2>
      <Card className="p-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <Info className="h-4 w-4" /> Gerto · ROAS Transfer — protótipo acadêmico v0.1
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12.5px] text-muted">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <a href="https://developer.apple.com/design/human-interface-guidelines/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-petrol dark:text-mint">
          Referência de design: Apple HIG <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Card>
    </div>
  );
}
