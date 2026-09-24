import { useEffect, useState } from 'react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Transaction, TransactionType } from '../types';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  store: BudgetStore;
  edit?: Transaction | null;
}

export function TransactionModal({ open, onClose, store, edit }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    if (edit) {
      setType(edit.type);
      setAmount(String(edit.amount));
      setCategoryId(edit.categoryId);
      setNote(edit.note);
      setDate(edit.date);
    } else {
      setType('expense');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      const first = store.categories.find((c) => c.type === 'expense');
      setCategoryId(first?.id ?? '');
    }
  }, [open, edit, store.categories]);

  useEffect(() => {
    const cats = store.categories.filter((c) => c.type === type);
    if (!cats.some((c) => c.id === categoryId)) {
      setCategoryId(cats[0]?.id ?? '');
    }
  }, [type, store.categories, categoryId]);

  const cats = store.categories.filter((c) => c.type === type);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || !categoryId) return;

    if (edit) {
      store.updateTransaction(edit.id, {
        type,
        amount: value,
        categoryId,
        note,
        date,
      });
    } else {
      store.addTransaction({ type, amount: value, categoryId, note, date });
    }
    onClose();
  };

  return (
    <Modal open={open} title={edit ? 'Kaydı düzenle' : 'Yeni hareket'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field full">
            <label>Tür</label>
            <div className="segment">
              <button
                type="button"
                className={`${type === 'income' ? 'active income' : ''}`}
                onClick={() => setType('income')}
              >
                Gelir
              </button>
              <button
                type="button"
                className={`${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setType('expense')}
              >
                Gider
              </button>
            </div>
          </div>

          <div className="field">
            <label>Tutar (₺)</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="field">
            <label>Tarih</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="field full">
            <label>Kategori</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label>Not</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn. Haftalık market"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary">
            Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}
