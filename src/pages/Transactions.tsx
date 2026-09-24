import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Transaction } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { CategoryIcon } from '../components/CategoryIcon';
import { TransactionModal } from '../components/TransactionModal';

export function Transactions({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [q, setQ] = useState('');

  const list = [...store.transactions]
    .filter((t) => filter === 'all' || t.type === filter)
    .filter((t) => {
      if (!q.trim()) return true;
      const cat = store.categories.find((c) => c.id === t.categoryId);
      return (
        t.note.toLowerCase().includes(q.toLowerCase()) ||
        cat?.name.toLowerCase().includes(q.toLowerCase())
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Hareketler</h1>
          <p className="subtitle">{list.length} kayıt listeleniyor</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
        >
          <Plus size={18} />
          Ekle
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div className="segment" style={{ maxWidth: 320, flex: 1 }}>
            {(
              [
                ['all', 'Tümü'],
                ['income', 'Gelir'],
                ['expense', 'Gider'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={`${filter === id ? 'active' : ''} ${id !== 'all' ? id : ''}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <input
              placeholder="Not veya kategori ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel">
        {list.length === 0 ? (
          <div className="empty">
            <strong>Kayıt bulunamadı</strong>
            Filtreleri temizle veya yeni hareket ekle.
          </div>
        ) : (
          <ul className="tx-list">
            {list.map((t) => {
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
                  <div className="tx-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEdit(t);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm('Bu kaydı silmek istiyor musun?')) {
                          store.deleteTransaction(t.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TransactionModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        store={store}
        edit={edit}
      />
    </div>
  );
}
