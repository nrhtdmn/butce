import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Debt } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { LiabilitySummary } from '../components/LiabilitySummary';

export function Debts({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [total, setTotal] = useState('');
  const [remaining, setRemaining] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [interestRate, setInterestRate] = useState('0');
  const [note, setNote] = useState('');
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState('');

  const list = store.debts;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(total);
    const r = Number(remaining || total);
    if (!title.trim() || !t) return;
    store.addDebt({
      title: title.trim(),
      creditor: creditor.trim() || '—',
      total: t,
      remaining: Math.min(t, r),
      dueDate,
      interestRate: Number(interestRate) || 0,
      note,
      status: 'active',
    });
    setOpen(false);
    setTitle('');
    setCreditor('');
    setTotal('');
    setRemaining('');
    setNote('');
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
          <p className="subtitle">
            Ödeme kaydı otomatik gidere yazılır ve bakiyeden düşer
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> Borç ekle
        </button>
      </div>

      <LiabilitySummary store={store} />

      <div className="grid-3">
        {list.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Borç kaydı yok</strong>
              Kredi kartı ekstresi veya kişi/kurum borçlarını ekle.
            </div>
          </div>
        ) : (
          list.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              store={store}
              onPay={() => {
                setPayId(d.id);
                setPayAmt(String(d.remaining));
              }}
            />
          ))
        )}
      </div>

      <Modal open={open} title="Yeni borç / ekstre" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Başlık</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kredi kartı ekstresi" />
            </div>
            <div className="field">
              <label>Alacaklı</label>
              <input value={creditor} onChange={(e) => setCreditor(e.target.value)} placeholder="Banka" />
            </div>
            <div className="field">
              <label>Son ödeme tarihi</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Toplam / ekstre</label>
              <input type="number" min="1" required value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div className="field">
              <label>Kalan</label>
              <input type="number" min="0" value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="Boş = toplam" />
            </div>
            <div className="field">
              <label>Aylık faiz %</label>
              <input type="number" min="0" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
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
}: {
  debt: Debt;
  store: BudgetStore;
  onPay: () => void;
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
        <button className="btn btn-danger btn-sm" onClick={() => store.deleteDebt(d.id)}>
          <Trash2 size={14} />
        </button>
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
