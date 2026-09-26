import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Debt } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { PageHeroStats } from '../components/LiabilitySummary';

const emptyForm = () => ({
  title: '',
  creditor: '',
  total: '',
  remaining: '',
  dueDate: new Date().toISOString().slice(0, 10),
  interestRate: '0',
  note: '',
});

export function Debts({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState('');

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (d: Debt) => {
    setEditId(d.id);
    setForm({
      title: d.title,
      creditor: d.creditor,
      total: String(d.total),
      remaining: String(d.remaining),
      dueDate: d.dueDate,
      interestRate: String(d.interestRate),
      note: d.note,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(form.total);
    const r = Number(form.remaining || form.total);
    if (!form.title.trim() || !t) return;
    const payload = {
      title: form.title.trim(),
      creditor: form.creditor.trim() || '—',
      total: t,
      remaining: Math.min(t, Math.max(0, r)),
      dueDate: form.dueDate,
      interestRate: Number(form.interestRate) || 0,
      note: form.note,
      status: (Math.min(t, Math.max(0, r)) <= 0 ? 'paid' : 'active') as Debt['status'],
    };
    if (editId) store.updateDebt(editId, payload);
    else store.addDebt(payload);
    closeForm();
  };

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payId) return;
    const amt = Number(payAmt);
    if (!amt) return;
    store.payDebt(payId, amt);
    setPayId(null);
    setPayAmt('');
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Borçlar</h1>
          <p className="subtitle">Ödeme kaydı otomatik gidere yazılır ve bakiyeden düşer</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Borç ekle
        </button>
      </div>

      <PageHeroStats store={store} variant="debts" />

      <div className="grid-3">
        {store.debts.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Borç kaydı yok</strong>
              Kredi kartı ekstresi veya kişi/kurum borçlarını ekle.
            </div>
          </div>
        ) : (
          store.debts.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              store={store}
              onEdit={() => openEdit(d)}
              onPay={() => {
                setPayId(d.id);
                setPayAmt(String(d.remaining));
              }}
            />
          ))
        )}
      </div>

      <Modal open={open} title={editId ? 'Borcu düzenle' : 'Yeni borç / ekstre'} onClose={closeForm}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kredi kartı ekstresi" />
            </div>
            <div className="field">
              <label>Alacaklı</label>
              <input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} placeholder="Banka" />
            </div>
            <div className="field">
              <label>Son ödeme tarihi</label>
              <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Toplam / ekstre</label>
              <input type="number" min="1" required value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            </div>
            <div className="field">
              <label>Kalan</label>
              <input type="number" min="0" value={form.remaining} onChange={(e) => setForm({ ...form, remaining: e.target.value })} placeholder="Boş = toplam" />
            </div>
            <div className="field">
              <label>Aylık faiz %</label>
              <input type="number" min="0" step="0.1" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
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

      <Modal open={!!payId} title="Borç öde (gidere eklenir)" onClose={() => setPayId(null)}>
        <form onSubmit={pay}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
            Bu tutar hareketlere gider olarak yazılır ve bakiyenden düşülür.
          </p>
          <div className="field">
            <label>Ödeme tutarı</label>
            <input type="number" min="1" required value={payAmt} onChange={(e) => setPayAmt(e.target.value)} autoFocus />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setPayId(null)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Ödendi</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DebtCard({
  debt: d,
  store,
  onPay,
  onEdit,
}: {
  debt: Debt;
  store: BudgetStore;
  onPay: () => void;
  onEdit: () => void;
}) {
  const pct = d.total > 0 ? Math.round(((d.total - d.remaining) / d.total) * 100) : 0;
  return (
    <div className="goal-card" style={{ ['--accent' as string]: d.status === 'paid' ? '#1B6B5A' : '#E76F51' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <strong>{d.title}</strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {d.creditor} · son ödeme {formatShortDate(d.dueDate)}
            {d.interestRate > 0 ? ` · %${d.interestRate} faiz` : ''}
          </div>
          {d.lastPaymentDate && (
            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: 2 }}>
              Son ödenen: {formatShortDate(d.lastPaymentDate)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Düzenle">
            <Pencil size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => store.deleteDebt(d.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div style={{ margin: '14px 0 6px', fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.35rem' }}>
        {formatMoney(d.remaining, store.settings)}
      </div>
      <div className="budget-meta" style={{ marginBottom: 8 }}>
        <span>Ödenen %{pct}</span>
        <span>/ {formatMoney(d.total, store.settings)}</span>
      </div>
      <div className="budget-bar" style={{ marginBottom: 12 }}>
        <span style={{ width: `${pct}%`, background: d.status === 'paid' ? 'var(--teal)' : '#E76F51' }} />
      </div>
      {d.status === 'active' ? (
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={onPay}>
          Ödendi
        </button>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Kapandı
        </span>
      )}
    </div>
  );
}
