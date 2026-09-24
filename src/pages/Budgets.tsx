import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney, monthLabel } from '../utils/format';
import { CategoryIcon } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

export function Budgets({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const expenseCats = store.categories.filter((c) => c.type === 'expense');
  const monthBudgets = store.budgets.filter((b) => b.month === store.month);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(limit);
    if (!categoryId || !value) return;
    store.upsertBudget({ categoryId, limit: value, month: store.month });
    setLimit('');
    setOpen(false);
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Bütçeler</h1>
          <p className="subtitle">{monthLabel(store.month)} limitleri</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setCategoryId(expenseCats[0]?.id ?? '');
            setOpen(true);
          }}
        >
          <Plus size={18} />
          Limit ekle
        </button>
      </div>

      <div className="grid-3">
        {monthBudgets.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Bu ay için bütçe yok</strong>
              Harcama kategorilerine aylık limit koy.
            </div>
          </div>
        ) : (
          monthBudgets.map((b) => {
            const cat = store.categories.find((c) => c.id === b.categoryId);
            const spent = store.spentByCategory(b.categoryId);
            const pct = Math.min(100, Math.round((spent / b.limit) * 100));
            const over = spent > b.limit;
            return (
              <div key={b.id} className="goal-card" style={{ ['--accent' as string]: cat?.color }}>
                <div className="cat-head" style={{ marginBottom: 16 }}>
                  <div className="cat-dot" style={{ background: cat?.color }}>
                    <CategoryIcon name={cat?.icon ?? 'cart'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{cat?.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {over ? 'Limit aşıldı' : `Kalan ${formatMoney(b.limit - spent, store.settings)}`}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => store.deleteBudget(b.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.03em',
                    color: over ? 'var(--danger)' : 'var(--ink)',
                  }}
                >
                  %{pct}
                </div>
                <div className="budget-bar" style={{ margin: '12px 0 8px' }}>
                  <span
                    style={{
                      width: `${pct}%`,
                      background: over
                        ? 'var(--danger)'
                        : pct >= 70
                          ? 'var(--warn)'
                          : cat?.color ?? 'var(--teal)',
                    }}
                  />
                </div>
                <div className="budget-meta">
                  <span>{formatMoney(spent, store.settings)}</span>
                  <span>/ {formatMoney(b.limit, store.settings)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={open} title="Bütçe limiti" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Kategori</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {expenseCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>Aylık limit (₺)</label>
              <input
                type="number"
                min="1"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
