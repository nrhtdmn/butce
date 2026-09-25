import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Receivable } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';

export function Receivables({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [debtor, setDebtor] = useState('');
  const [total, setTotal] = useState('');
  const [remaining, setRemaining] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [collectId, setCollectId] = useState<string | null>(null);
  const [collectAmt, setCollectAmt] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(total);
    const r = Number(remaining || total);
    if (!title.trim() || !t) return;
    store.addReceivable({
      title: title.trim(),
      debtor: debtor.trim() || '—',
      total: t,
      remaining: Math.min(t, r),
      dueDate,
      note,
      status: 'active',
    });
    setOpen(false);
    setTitle('');
    setDebtor('');
    setTotal('');
    setRemaining('');
    setNote('');
  };

  const collect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectId) return;
    const amt = Number(collectAmt);
    const item = store.receivables.find((r) => r.id === collectId);
    if (!item || !amt) return;
    const remainingNext = Math.max(0, item.remaining - amt);
    store.updateReceivable(collectId, {
      remaining: remainingNext,
      status: remainingNext <= 0 ? 'paid' : 'active',
    });
    setCollectId(null);
    setCollectAmt('');
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Alacaklar</h1>
          <p className="subtitle">
            Toplam kalan: {formatMoney(store.totalReceivable, store.settings)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> Alacak ekle
        </button>
      </div>

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
            <RecvCard key={r.id} item={r} store={store} onCollect={() => setCollectId(r.id)} />
          ))
        )}
      </div>

      <Modal open={open} title="Yeni alacak" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label>Borçlu</label>
              <input value={debtor} onChange={(e) => setDebtor(e.target.value)} />
            </div>
            <div className="field">
              <label>Vade</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Toplam</label>
              <input type="number" min="1" required value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div className="field">
              <label>Kalan</label>
              <input type="number" min="0" value={remaining} onChange={(e) => setRemaining(e.target.value)} />
            </div>
            <div className="field full">
              <label>Not</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!collectId} title="Tahsilat" onClose={() => setCollectId(null)}>
        <form onSubmit={collect}>
          <div className="field">
            <label>Alınan tutar</label>
            <input type="number" min="1" required value={collectAmt} onChange={(e) => setCollectAmt(e.target.value)} autoFocus />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setCollectId(null)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
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
}: {
  item: Receivable;
  store: BudgetStore;
  onCollect: () => void;
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
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => store.deleteReceivable(r.id)}>
          <Trash2 size={14} />
        </button>
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
          Tahsilat kaydet
        </button>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Tahsil edildi
        </span>
      )}
    </div>
  );
}
