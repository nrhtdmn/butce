import { useState } from 'react';
import { MobileToggle, PAGE_META, Sidebar } from './components/Sidebar';
import { InstallPrompt } from './components/InstallPrompt';
import { useBudgetStore } from './hooks/useBudgetStore';
import type { PageId } from './types';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Debts } from './pages/Debts';
import { Receivables } from './pages/Receivables';
import { Installments } from './pages/Installments';
import { Advice } from './pages/Advice';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function App() {
  const store = useBudgetStore();
  const [page, setPage] = useState<PageId>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const meta = PAGE_META[page];

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onNavigate={setPage}
        store={store}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <main className="main" aria-label={meta.title}>
        {page === 'dashboard' && <Dashboard store={store} />}
        {page === 'transactions' && <Transactions store={store} />}
        {page === 'categories' && <Categories store={store} />}
        {page === 'budgets' && <Budgets store={store} />}
        {page === 'goals' && <Goals store={store} />}
        {page === 'debts' && <Debts store={store} />}
        {page === 'receivables' && <Receivables store={store} />}
        {page === 'installments' && <Installments store={store} />}
        {page === 'advice' && <Advice store={store} />}
        {page === 'reports' && <Reports store={store} />}
        {page === 'settings' && <Settings store={store} />}
      </main>
      <MobileToggle open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
      <InstallPrompt />
    </div>
  );
}

export default App;
