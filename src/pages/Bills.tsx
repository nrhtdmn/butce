import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Bill, BillKind } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';
import { PageHeroStats } from '../components/LiabilitySummary';

const KIND_LABEL: Record<BillKind, string> = {
  utility: 'Fatura',
  statement: 'Ekstre',
  subscription: 'Abonelik',
  other: 'Diğer',
};

const emptyForm = () => ({
  title: '',
  provider: '',
  amount: '',
  dueDate: new Date().toISOString().slice(0, 10),
  kind: 'utility' as BillKind,
  note: '',
  status: 'pending' as Bill['status'],
});

export function Bills({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const pending = store.bills.filter((b) => b.status === 'pending');
  const paid = store.bills.filter((b) => b.status === 'paid');

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openEdit = (b: Bill) => {
    setEditId(b.id);
    setForm({
      title: b.title,
      provider: b.provider,
      amount: String(b.amount),
      dueDate: b.dueDate,
      kind: b.kind,
      note: b.note,
      status: b.status,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.title.trim() || !amt) return;
    const payload = {
      title: form.title.trim(),
      provider: form.provider.trim() || '—',
      amount: amt,
      dueDate: form.dueDate,
      kind: form.kind,
      note: form.note,
      status: form.status,
    };
    if (editId) store.updateBill(editId, payload);
    else store.addBill({ ...payload, status: 'pending' });
    closeForm();
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Faturalar & Ekstre</h1>
          <p className="subtitle">Son ödeme tarihlerini takip et · ödeyince bakiyeden düşer</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus size={18} /> Ekle
        </button>
      </div>

      <PageHeroStats store={store} variant="bills" />

      <h3 style={{ fontFamily: 'var(--display)', marginBottom: 12, fontSize: '1rem' }}>
        Ödenecek ({pending.length})
      </h3>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {pending.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Bekleyen fatura yok</strong>
              Elektrik, internet veya kredi kartı ekstresi ekle.
            </div>
          </div>
        ) : (
          pending.map((b) => <BillCard key={b.id} bill={b} store={store} onEdit={() => openEdit(b)} />)
        )}
      </div>

      {paid.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'var(--display)', marginBottom: 12, fontSize: '1rem' }}>
            Ödenenler
          </h3>
          <div className="grid-3">
            {paid.map((b) => (
              <BillCard key={b.id} bill={b} store={store} onEdit={() => openEdit(b)} />
            ))}
          </div>
        </>
      )}

      <Modal open={open} title={editId ? 'Faturayı düzenle' : 'Fatura / ekstre ekle'} onClose={closeForm}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Tür</label>
              <div className="segment">
                {(Object.keys(KIND_LABEL) as BillKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={form.kind === k ? 'active' : ''}
                    onClick={() => setForm({ ...form, kind: k })}
                  >
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Başlık</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kredi kartı ekstresi" />
            </div>
            <div className="field">
              <label>Kurum</label>
              <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Banka / BEDAŞ" />
            </div>
            <div className="field">
              <label>Son ödeme tarihi</label>
              <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="field full">
              <label>Tutar</label>
              <input type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            {editId && (
              <div className="field full">
                <label>Durum</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Bill['status'] })}
                >
                  <option value="pending">Ödenecek</option>
                  <option value="paid">Ödendi</option>
                </select>
              </div>
            )}
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

function BillCard({
  bill: b,
  store,
  onEdit,
}: {
  bill: Bill;
  store: BudgetStore;
  onEdit: () => void;
}) {
  const overdue = b.status === 'pending' && b.dueDate < new Date().toISOString().slice(0, 10);
  return (
    <div
      className="goal-card"
      style={{ ['--accent' as string]: b.status === 'paid' ? '#1B6B5A' : overdue ? '#E24B4A' : '#E9C46A' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <strong>{b.title}</strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {KIND_LABEL[b.kind]} · {b.provider}
          </div>
          <div style={{ fontSize: '0.78rem', color: overdue ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>
            Son ödeme: {formatShortDate(b.dueDate)}
            {overdue ? ' · gecikti' : ''}
          </div>
          {b.lastPaymentDate && (
            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: 2 }}>
              Ödendi: {formatShortDate(b.lastPaymentDate)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Düzenle">
            <Pencil size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => store.deleteBill(b.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div style={{ margin: '14px 0 12px', fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.35rem' }}>
        {formatMoney(b.amount, store.settings)}
      </div>
      {b.status === 'pending' ? (
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={() => {
            if (confirm(`${formatMoney(b.amount, store.settings)} gidere eklensin mi?`)) {
              store.payBill(b.id);
            }
          }}
        >
          Ödendi (gidere ekle)
        </button>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> Ödendi
        </span>
      )}
    </div>
  );
}
