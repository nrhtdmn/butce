import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Installment } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { LiabilitySummary } from '../components/LiabilitySummary';
import { installmentRemaining } from '../utils/finance';

export function Installments({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalCount, setTotalCount] = useState('12');
  const [paidCount, setPaidCount] = useState('0');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalAmount);
    const count = Number(totalCount);
    const paid = Number(paidCount) || 0;
    let monthly = Number(monthlyAmount);
    if (!title.trim() || !total || !count) return;
    if (!monthly) monthly = Math.round(total / count);
    store.addInstallment({
      title: title.trim(),
      totalAmount: total,
      monthlyAmount: monthly,
      totalCount: count,
      paidCount: Math.min(paid, count),
      nextDueDate,
      note,
      status: paid >= count ? 'paid' : 'active',
    });
    setOpen(false);
    setTitle('');
    setTotalAmount('');
    setMonthlyAmount('');
    setNote('');
    setPaidCount('0');
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Taksitler</h1>
          <p className="subtitle">
            “Ödendi” deyince aylık tutar gidere yazılır · yük {formatMoney(store.monthlyInstallments, store.settings)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> Taksit ekle
        </button>
      </div>

      <LiabilitySummary store={store} />

      <div className="grid-3">
        {store.installments.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Taksit yok</strong>
              Telefon, ev eşyası veya kredi taksitlerini buraya ekle.
            </div>
          </div>
        ) : (
          store.installments.map((i) => <InstCard key={i.id} item={i} store={store} />)
        )}
      </div>

      <Modal open={open} title="Yeni taksit" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Telefon" />
            </div>
            <div className="field">
              <label>Toplam tutar</label>
              <input type="number" min="1" required value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
            </div>
            <div className="field">
              <label>Aylık tutar</label>
              <input type="number" min="0" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} placeholder="Otomatik" />
            </div>
            <div className="field">
              <label>Taksit sayısı</label>
              <input type="number" min="1" required value={totalCount} onChange={(e) => setTotalCount(e.target.value)} />
            </div>
            <div className="field">
              <label>Ödenen adet</label>
              <input type="number" min="0" value={paidCount} onChange={(e) => setPaidCount(e.target.value)} />
            </div>
            <div className="field full">
              <label>Sonraki / son ödeme tarihi</label>
              <input type="date" required value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
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
    </div>
  );
}

function InstCard({ item: i, store }: { item: Installment; store: BudgetStore }) {
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
        <button className="btn btn-danger btn-sm" onClick={() => store.deleteInstallment(i.id)}>
          <Trash2 size={14} />
        </button>
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
