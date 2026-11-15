import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, Moon, Sun, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { authService } from '../services/auth';
import { NetworkError } from '../services/network';
import { isValidEmail } from '../utils/masks';
import { Button, Field, Input, Toggle } from '../components/ui/primitives';
import { InlineAlert } from '../components/ui/States';
import Sheet from '../components/ui/Sheet';
import { Logo } from '../components/layout/AppLayout';


/** CA 1 — Recuperação de senha (simulada: o código é exibido na tela, pois não há envio de e-mail real). */
function RecoverySheet({ open, onClose, initialEmail }) {
  const toast = useToast();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail || '');
  const [demoCode, setDemoCode] = useState('');
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    setStep('email');
    setCode('');
    setPwd('');
    setError('');
    setDemoCode('');
    onClose();
  };

  const request = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.requestReset(email);
      if (!res.found) setError('E-mail não localizado na base de usuários.');
      else {
        setDemoCode(res.code);
        setStep('code');
        toast.show('MSG05');
      }
    } catch (e) {
      if (e instanceof NetworkError) toast.show('MSG02');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setError('');
    if (pwd.length < 8) return setError('A nova senha deve ter ao menos 8 caracteres.');
    setLoading(true);
    try {
      const res = await authService.confirmReset(email, code.trim(), pwd);
      if (!res.ok) setError('Código inválido ou expirado.');
      else {
        toast.show('MSG06');
        close();
      }
    } catch (e) {
      if (e instanceof NetworkError) toast.show('MSG02');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Esqueci minha senha" subtitle="Redefinição de senha da conta administrativa" size="sm">
      {step === 'email' ? (
        <div className="space-y-4">
          <Field label="E-mail cadastrado" required error={error}>
            <Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@roastransfer.demo" invalid={!!error} />
          </Field>
          <Button className="w-full" onClick={request} loading={loading} disabled={!isValidEmail(email)}>
            Enviar código
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <InlineAlert code="MSG05">
            <p className="mt-1 text-[12.5px] opacity-90">
              Demonstração: não há envio real de e-mail. Código gerado: <strong className="font-mono tracking-widest">{demoCode}</strong>
            </p>
          </InlineAlert>
          <Field label="Código de redefinição" required>
            <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </Field>
          <Field label="Nova senha" required error={error} hint="Mínimo de 8 caracteres.">
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} invalid={!!error} />
          </Field>
          <Button className="w-full" onClick={confirm} loading={loading} disabled={code.length !== 6 || !pwd}>
            Redefinir senha
          </Button>
        </div>
      )}
    </Sheet>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const { net, setNetwork } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState(null);
  const [recovery, setRecovery] = useState(false);

  const emailValid = isValidEmail(email); // Passo 2 — valida sintaxe e habilita "Entrar"

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorCode(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate(location.state?.from || '/', { replace: true });
    else setErrorCode(res.code);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sage/30 blur-3xl dark:bg-teal/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-sand/60 blur-3xl dark:bg-petrol/15" />
      <button
        onClick={toggle}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/70 text-ink backdrop-blur"
        aria-label="Alternar modo claro/escuro"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo compact />
          <h1 className="mt-4 text-[30px] font-bold text-ink">Gerto</h1>
          <p className="mt-1 text-[15px] text-muted">Gestão operacional da ROAS Transfer</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          {errorCode && <InlineAlert code={errorCode} />}
          <Field label="E-mail" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <Input type="email" autoComplete="username" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@roastransfer.demo" invalid={errorCode === 'MSG03'} />
            </div>
          </Field>
          <Field label="Senha" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <Input type={show ? 'text' : 'password'} autoComplete="current-password" className="px-10" value={password} onChange={(e) => setPassword(e.target.value)} invalid={errorCode === 'MSG03'} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!emailValid || !password} icon={ArrowRight}>
            Entrar
          </Button>
          <button type="button" onClick={() => setRecovery(true)} className="mx-auto flex items-center gap-1.5 text-[14px] font-medium text-petrol dark:text-mint">
            <KeyRound className="h-4 w-4" /> Esqueci minha senha
          </button>
        </form>

        <div className="card mt-4 p-5">
          <div>
            <Toggle id="login-offline" checked={net.offline} onChange={(v) => setNetwork({ offline: v })} label="Simular Offline" description="Testa a falha de conexão no login ([MSG02])." />
          </div>
          {net.offline && (
            <p className="mt-3 flex items-center gap-2 text-[12px] font-medium text-red-600 dark:text-red-400">
              <WifiOff className="h-4 w-4" /> Modo offline ativo
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-[11.5px] text-muted">Protótipo acadêmico — autenticação e JWT simulados, sem segurança real.</p>
      </div>

      <RecoverySheet open={recovery} onClose={() => setRecovery(false)} initialEmail={email} />
    </div>
  );
}
