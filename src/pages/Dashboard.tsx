import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Sparkles, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney, formatShortDate, monthLabel } from '../utils/format';
import { CategoryIcon } from '../components/CategoryIcon';
import { TransactionModal } from '../components/TransactionModal';

export function Dashboard({ store }: { store: BudgetStore }) {
  const [modalOpen, setModalOpen] = useState(false);
  const rate = store.income > 0 ? Math.round(((store.income - store.expense) / store.income) * 100) : 0;

  const chartData = useMemo(() => {
    const days: Record<string, { date: string; gelir: number; gider: number }> = {};
    for (const t of store.monthTx) {
      const key = t.date.slice(8);
      if (!days[key]) days[key] = { date: key, gelir: 0, gider: 0 };
      if (t.type === 'income') days[key].gelir += t.amount;
      else days[key].gider += t.amount;
    }
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [store.monthTx]);

  const recent = [...store.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const topBudgets = store.budgets
    .filter((b) => b.month === store.month)
    .map((b) => {
      const cat = store.categories.find((c) => c.id === b.categoryId);
      const spent = store.spentByCategory(b.categoryId);
      return { ...b, cat, spent, pct: Math.min(100, Math.round((spent / b.limit) * 100)) };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>
            Merhaba {store.settings.name || 'gezgin'}
          </h1>
          <p className="subtitle">{monthLabel(store.month)} · DENGE özeti</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          Yeni kayıt
        </button>
      </div>

      <div className="grid-stats">
        <motion.div
          className="stat stat-balance"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="stat-label">
            <PiggyBank size={16} /> Toplam bakiye
          </div>
          <div className="stat-value">{formatMoney(store.balance, store.settings)}</div>
          <div className="stat-hint">Tüm hesapların net durumu</div>
        </motion.div>

        <motion.div
          className="stat stat-income"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-label">
            <ArrowDownLeft size={16} /> Bu ay gelir
          </div>
          <div className="stat-value">{formatMoney(store.income, store.settings)}</div>
          <div className="stat-hint">+{store.monthTx.filter((t) => t.type === 'income').length} işlem</div>
        </motion.div>

        <motion.div
          className="stat stat-expense"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="stat-label">
            <ArrowUpRight size={16} /> Bu ay gider
          </div>
          <div className="stat-value">{formatMoney(store.expense, store.settings)}</div>
          <div className="stat-hint">{store.monthTx.filter((t) => t.type === 'expense').length} harcama</div>
        </motion.div>

        <motion.div
          className="stat stat-rate"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-label">
            <Sparkles size={16} /> Tasarruf oranı
          </div>
          <div className="stat-value">%{rate}</div>
          <div className="stat-hint">
            Net {formatMoney(store.income - store.expense, store.settings)}
          </div>
        </motion.div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Aylık nakit akışı</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B6B5A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1B6B5A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E76F51" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E76F51" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,31,26,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#5c736b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#5c736b" width={48} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gelir"
                  stroke="#1B6B5A"
                  fill="url(#gIn)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="gider"
                  stroke="#E76F51"
                  fill="url(#gOut)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Bütçe nabzı</div>
          {topBudgets.length === 0 ? (
            <div className="empty">
              <strong>Henüz bütçe yok</strong>
              Bütçeler menüsünden limit ekle.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topBudgets.map((b) => (
                <div key={b.id}>
                  <div className="budget-meta" style={{ marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)', fontWeight: 600 }}>
                      <span
                        className="cat-dot"
                        style={{ width: 28, height: 28, background: b.cat?.color, borderRadius: 8 }}
                      >
                        <CategoryIcon name={b.cat?.icon ?? 'cart'} size={14} />
                      </span>
                      {b.cat?.name}
                    </span>
                    <span>%{b.pct}</span>
                  </div>
                  <div className="budget-bar">
                    <span
                      style={{
                        width: `${b.pct}%`,
                        background:
                          b.pct >= 90
                            ? 'var(--danger)'
                            : b.pct >= 70
                              ? 'var(--warn)'
                              : 'var(--teal)',
                      }}
                    />
                  </div>
                  <div className="budget-meta" style={{ marginTop: 4 }}>
                    <span>{formatMoney(b.spent, store.settings)}</span>
                    <span>/ {formatMoney(b.limit, store.settings)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Son hareketler</div>
        <ul className="tx-list">
          {recent.map((t) => {
            const cat = store.categories.find((c) => c.id === t.categoryId);
            return (
              <li key={t.id} className="tx-row">
                <div className="tx-icon" style={{ background: cat?.color ?? '#888' }}>
                  <CategoryIcon name={cat?.icon ?? 'cart'} />
                </div>
                <div className="tx-meta">
                  <strong>{t.note || cat?.name}</strong>
                  <span>
                    {cat?.name} · {formatShortDate(t.date)}
                  </span>
                </div>
                <div className={`tx-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '−'}
                  {formatMoney(t.amount, store.settings)}
                </div>
                <div />
              </li>
            );
          })}
        </ul>
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} store={store} />
    </div>
  );
}
