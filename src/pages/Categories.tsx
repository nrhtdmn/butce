import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { TransactionType } from '../types';
import { CategoryIcon, ICON_OPTIONS } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

const COLORS = [
  '#1B6B5A',
  '#2A9D8F',
  '#457B9D',
  '#E76F51',
  '#F4A261',
  '#E9C46A',
  '#E63946',
  '#9B5DE5',
  '#C77DFF',
  '#00BBF9',
];

export function Categories({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [icon, setIcon] = useState('cart');
  const [color, setColor] = useState(COLORS[3]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.addCategory({ name: name.trim(), type, icon, color });
    setName('');
    setOpen(false);
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Kategoriler</h1>
          <p className="subtitle">{store.categories.length} kategori tanımlı</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Yeni kategori
        </button>
      </div>

      {(['income', 'expense'] as const).map((group) => (
        <div key={group} style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontFamily: 'var(--display)',
              marginBottom: 12,
              fontSize: '1rem',
            }}
          >
            {group === 'income' ? 'Gelir kategorileri' : 'Gider kategorileri'}
          </h3>
          <div className="cat-grid">
            {store.categories
              .filter((c) => c.type === group)
              .map((c) => (
                <div key={c.id} className="cat-card">
                  <div className="cat-head">
                    <div className="cat-dot" style={{ background: c.color }}>
                      <CategoryIcon name={c.icon} />
                    </div>
                    <div>
                      <strong>{c.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {store.transactions.filter((t) => t.categoryId === c.id).length} işlem
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (confirm(`"${c.name}" silinsin mi? İlişkili kayıtlar da silinir.`)) {
                        store.deleteCategory(c.id);
                      }
                    }}
                  >
                    <Trash2 size={14} /> Sil
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      <Modal open={open} title="Yeni kategori" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Tür</label>
              <div className="segment">
                <button
                  type="button"
                  className={type === 'income' ? 'active income' : ''}
                  onClick={() => setType('income')}
                >
                  Gelir
                </button>
                <button
                  type="button"
                  className={type === 'expense' ? 'active expense' : ''}
                  onClick={() => setType('expense')}
                >
                  Gider
                </button>
              </div>
            </div>
            <div className="field full">
              <label>Ad</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field full">
              <label>İkon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: icon === ic ? '2px solid var(--teal)' : '1px solid var(--line)',
                      background: icon === ic ? 'rgba(27,107,90,0.1)' : '#fff',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <CategoryIcon name={ic} size={16} />
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Renk</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: c,
                      outline: color === c ? '3px solid var(--ink)' : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary">
              Ekle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
