import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Receivable } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { PageHeroStats } from '../components/LiabilitySummary';

const emptyForm = () => ({
  title: '',
  debtor: '',
  total: '',
  remaining: '',
  dueDate: new Date().toISOString().slice(0, 10),
  note: '',
});

export function Receivables({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [collectId, setCollectId] = useState<string | null>(null);
  const [collectAmt, setCollectAmt] = useState('');

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openEdit = (r: Receivable) => {
    setEditId(r.id);
    setForm({
      title: r.title,
      debtor: r.debtor,
      total: String(r.total),
      remaining: String(r.remaining),
      dueDate: r.dueDate,
      note: r.note,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(form.total);
    const r = Number(form.remaining || form.total);
    if (!form.title.trim() || !t) return;
    const remaining = Math.min(t, Math.max(0, r));
    const payload = {
      title: form.title.trim(),
      debtor: form.debtor.trim() || '—',
      total: t,
      remaining,
      dueDate: form.dueDate,
      note: form.note,
      status: (remaining <= 0 ? 'paid' : 'active') as Receivable['status'],
    };
    if (editId) store.updateReceivable(editId, payload);
    else store.addReceivable(payload);
    closeForm();
  };

  const collect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectId) return;
    const amt = Number(collectAmt);
    if (!amt) return;
    store.collectReceivable(collectId, amt);
    setCollectId(null);
    setCollectAmt('');
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Alacaklar</h1>
          <p className="subtitle">Tahsilat otomatik gelire yazılır ve bakiyeye eklenir</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus size={18} /> Alacak ekle
        </button>
      </div>

      <PageHeroStats store={store} variant="receivables" />

      <div className="grid-3">
        {store.receivables.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Alacak yok</strong>
              Sana borçlu olan kişi veya kurumları kaydet.
            </div>
          </div>
        ) : (
          store.receivables.map((r) => (
            <RecvCard
              key={r.id}
              item={r}
              store={store}
              onEdit={() => openEdit(r)}
              onCollect={() => {
                setCollectId(r.id);
                setCollectAmt(String(r.remaining));
              }}
            />
          ))
        )}
      </div>

      <Modal open={open} title={editId ? 'Alacağı düzenle' : 'Yeni alacak'} onClose={closeForm}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Borçlu</label>
              <input value={form.debtor} onChange={(e) => setForm({ ...form, debtor: e.target.value })} />
            </div>
            <div className="field">
              <label>Son ödeme / vade</label>
              <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Toplam</label>
              <input type="number" min="1" required value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            </div>
            <div className="field">
              <label>Kalan</label>
              <input type="number" min="0" value={form.remaining} onChange={(e) => setForm({ ...form, remaining: e.target.value })} />
            </div>
            <div className="field full">
              <label>Not</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeForm}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!collectId} title="Tahsilat (gelire eklenir)" onClose={() => setCollectId(null)}>
        <form onSubmit={collect}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
            Bu tutar harekete gelir olarak yazılır ve bakiyene eklenir.
          </p>
          <div className="field">
            <label>Alınan tutar</label>
            <input type="number" min="1" required value={collectAmt} onChange={(e) => setCollectAmt(e.target.value)} autoFocus />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setCollectId(null)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Tahsil edildi</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RecvCard({
  item: r,
  store,
  onCollect,
  onEdit,
}: {
  item: Receivable;
  store: BudgetStore;
  onCollect: () => void;
  onEdit: () => void;
}) {
  const pct = r.total > 0 ? Math.round(((r.total - r.remaining) / r.total) * 100) : 0;
  return (
    <div className="goal-card" style={{ ['--accent' as string]: '#2A9D8F' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <strong>{r.title}</strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {r.debtor} · vade {formatShortDate(r.dueDate)}
          </div>
          {r.lastPaymentDate && (
            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: 2 }}>
              Son tahsilat: {formatShortDate(r.lastPaymentDate)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Düzenle">
            <Pencil size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => store.deleteReceivable(r.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div style={{ margin: '14px 0 6px', fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--teal)' }}>
        {formatMoney(r.remaining, store.settings)}
      </div>
      <div className="budget-meta" style={{ marginBottom: 8 }}>
        <span>Tahsil %{pct}</span>
        <span>/ {formatMoney(r.total, store.settings)}</span>
      </div>
      <div className="budget-bar" style={{ marginBottom: 12 }}>
        <span style={{ width: `${pct}%`, background: 'var(--teal)' }} />
      </div>
      {r.status === 'active' ? (
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={onCollect}>
          Tahsil edildi
        </button>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Kapandı
        </span>
      )}
    </div>
  );
}
