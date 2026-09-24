import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PieChart,
  Target,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import type { PageId } from '../types';
import { formatMoney } from '../utils/format';
import type { BudgetStore } from '../hooks/useBudgetStore';

const NAV: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
  { id: 'transactions', label: 'Hareketler', icon: ArrowLeftRight },
  { id: 'categories', label: 'Kategoriler', icon: Tags },
  { id: 'budgets', label: 'Bütçeler', icon: PieChart },
  { id: 'goals', label: 'Hedefler', icon: Target },
  { id: 'reports', label: 'Raporlar', icon: BarChart3 },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

interface SidebarProps {
  page: PageId;
  onNavigate: (id: PageId) => void;
  store: BudgetStore;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ page, onNavigate, store, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">D</div>
          <div className="brand-text">
            <span className="brand-name">DENGE</span>
            <span className="brand-tag">Akıllı bütçe</span>
          </div>
        </div>

        <ul className="nav-list">
          {NAV.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                className={`nav-item ${page === id ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(id);
                  onClose();
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <p>Güncel bakiye</p>
          <strong>{formatMoney(store.balance, store.settings)}</strong>
          <p className="credit">
            <a
              href="https://www.instagram.com/nurhatduman/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nurhat DUMAN
            </a>{' '}
            tarafından üretilmiştir
          </p>
        </div>
      </aside>
    </>
  );
}

export function MobileToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className="mobile-nav-toggle" onClick={onToggle} aria-label="Menü">
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
  );
}

export const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Merhaba, dengeni koru',
    subtitle: 'Bu ayın nabzı tek bakışta',
  },
  transactions: {
    title: 'Hareketler',
    subtitle: 'Gelir ve gider kayıtların',
  },
  categories: {
    title: 'Kategoriler',
    subtitle: 'Paranın gittiği yerleri tanımla',
  },
  budgets: {
    title: 'Bütçeler',
    subtitle: 'Limit koy, aşımı önceden gör',
  },
  goals: {
    title: 'Hedefler',
    subtitle: 'Birikimlerini görünür kıl',
  },
  reports: {
    title: 'Raporlar',
    subtitle: 'Trendleri ve dağılımı incele',
  },
  settings: {
    title: 'Ayarlar',
    subtitle: 'Uygulamayı kendine göre ayarla',
  },
};
