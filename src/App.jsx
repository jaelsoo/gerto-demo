import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Agenda from './pages/Agenda';
import History from './pages/History';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Interpreters from './pages/Interpreters';
import Clients from './pages/Clients';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import Templates from './pages/Templates';
import More from './pages/More';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const { session } = useAuth();
  return session ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route index element={<Dashboard />} />
                  {/* MVP 1 */}
                  <Route path="servicos" element={<Services />} />
                  <Route path="servicos/:id" element={<ServiceDetail />} />
                  <Route path="frota" element={<Fleet />} />
                  <Route path="motoristas" element={<Drivers />} />
                  <Route path="interpretes" element={<Interpreters />} />
                  <Route path="clientes" element={<Clients />} />
                  {/* MVP 2 */}
                  <Route path="agenda" element={<Agenda />} />
                  {/* MVP 3 */}
                  <Route path="historico" element={<History />} />
                  {/* MVP 4 */}
                  <Route path="financeiro" element={<Finance />} />
                  <Route path="financeiro/relatorios" element={<Reports />} />
                  {/* MVP 5 */}
                  <Route path="financeiro/contabil" element={<Accounting />} />
                  <Route path="contratos" element={<Contracts />} />
                  <Route path="contratos/templates" element={<Templates />} />
                  <Route path="contratos/:id" element={<ContractDetail />} />
                  <Route path="mais" element={<More />} />
                  <Route path="configuracoes" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </HashRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
