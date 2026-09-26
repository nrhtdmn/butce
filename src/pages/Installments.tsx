import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Installment } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { PageHeroStats } from '../components/LiabilitySummary';
import { installmentRemaining } from '../utils/finance';

const emptyForm = () => ({
  title: '',
  totalAmount: '',
  totalCount: '12',
  paidCount: '0',
  monthlyAmount: '',
  nextDueDate: new Date().toISOString().slice(0, 10),
  note: '',
});

export function Installments({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openEdit = (i: Installment) => {
    setEditId(i.id);
    setForm({
      title: i.title,
      totalAmount: String(i.totalAmount),
      totalCount: String(i.totalCount),
      paidCount: String(i.paidCount),
      monthlyAmount: String(i.monthlyAmount),
      nextDueDate: i.nextDueDate,
      note: i.note,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(form.totalAmount);
    const count = Number(form.totalCount);
    const paid = Number(form.paidCount) || 0;
    let monthly = Number(form.monthlyAmount);
    if (!form.title.trim() || !total || !count) return;
    if (!monthly) monthly = Math.round(total / count);
    const paidCount = Math.min(paid, count);
    const payload = {
      title: form.title.trim(),
      totalAmount: total,
      monthlyAmount: monthly,
      totalCount: count,
      paidCount,
      nextDueDate: form.nextDueDate,
      note: form.note,
      status: (paidCount >= count ? 'paid' : 'active') as Installment['status'],
    };
    if (editId) store.updateInstallment(editId, payload);
    else store.addInstallment(payload);
    closeForm();
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Taksitler</h1>
          <p className="subtitle">
            “Ödendi” deyince aylık tutar gidere yazılır · yük{' '}
            {formatMoney(store.monthlyInstallments, store.settings)}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus size={18} /> Taksit ekle
        </button>
      </div>

      <PageHeroStats store={store} variant="installments" />

      <div className="grid-3">
        {store.installments.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Taksit yok</strong>
              Telefon, ev eşyası veya kredi taksitlerini buraya ekle.
            </div>
          </div>
        ) : (
          store.installments.map((i) => (
            <InstCard key={i.id} item={i} store={store} onEdit={() => openEdit(i)} />
          ))
        )}
      </div>

      <Modal open={open} title={editId ? 'Taksiti düzenle' : 'Yeni taksit'} onClose={closeForm}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Telefon" />
            </div>
            <div className="field">
              <label>Toplam tutar</label>
              <input type="number" min="1" required value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
            </div>
            <div className="field">
              <label>Aylık tutar</label>
              <input type="number" min="0" value={form.monthlyAmount} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })} placeholder="Otomatik" />
            </div>
            <div className="field">
              <label>Taksit sayısı</label>
              <input type="number" min="1" required value={form.totalCount} onChange={(e) => setForm({ ...form, totalCount: e.target.value })} />
            </div>
            <div className="field">
              <label>Ödenen adet</label>
              <input type="number" min="0" value={form.paidCount} onChange={(e) => setForm({ ...form, paidCount: e.target.value })} />
            </div>
            <div className="field full">
              <label>Sonraki / son ödeme tarihi</label>
              <input type="date" required value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
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
    </div>
  );
}

function InstCard({
  item: i,
  store,
  onEdit,
}: {
  item: Installment;
  store: BudgetStore;
  onEdit: () => void;
}) {
  const pct = i.totalCount > 0 ? Math.round((i.paidCount / i.totalCount) * 100) : 0;
  const left = Math.max(0, i.totalCount - i.paidCount);
  return (
    <div className="goal-card" style={{ ['--accent' as string]: '#457B9D' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <strong>{i.title}</strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {i.paidCount}/{i.totalCount} · son ödeme {formatShortDate(i.nextDueDate)}
          </div>
          {i.lastPaymentDate && (
            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: 2 }}>
              Son ödenen: {formatShortDate(i.lastPaymentDate)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Düzenle">
            <Pencil size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => store.deleteInstallment(i.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div style={{ margin: '14px 0 6px', fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.35rem' }}>
        {formatMoney(i.monthlyAmount, store.settings)}
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)', marginLeft: 6 }}>/ ay</span>
      </div>
      <div className="budget-meta" style={{ marginBottom: 8 }}>
        <span>%{pct} · kalan {formatMoney(installmentRemaining(i), store.settings)}</span>
        <span>{left} taksit</span>
      </div>
      <div className="budget-bar" style={{ marginBottom: 12 }}>
        <span style={{ width: `${pct}%`, background: '#457B9D' }} />
      </div>
      {i.status === 'active' ? (
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={() => {
            if (confirm(`${formatMoney(i.monthlyAmount, store.settings)} gidere eklensin mi?`)) {
              store.payInstallment(i.id);
            }
          }}
        >
          Ödendi (gidere ekle)
        </button>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Tamamlandı
        </span>
      )}
    </div>
  );
}
