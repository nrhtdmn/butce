import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { Goal } from '../types';
import { formatMoney, formatShortDate } from '../utils/format';
import { Modal } from '../components/Modal';

const GOAL_COLORS = ['#1B6B5A', '#E76F51', '#457B9D', '#E9C46A', '#9B5DE5'];

const emptyForm = () => ({
  name: '',
  target: '',
  saved: '',
  deadline: '',
  color: GOAL_COLORS[0],
});

export function Goals({ store }: { store: BudgetStore }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmt, setContributeAmt] = useState('');

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openEdit = (g: Goal) => {
    setEditId(g.id);
    setForm({
      name: g.name,
      target: String(g.target),
      saved: String(g.saved),
      deadline: g.deadline,
      color: g.color,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(form.target);
    const s = Number(form.saved) || 0;
    if (!form.name.trim() || !t || !form.deadline) return;
    const payload = {
      name: form.name.trim(),
      target: t,
      saved: s,
      deadline: form.deadline,
      color: form.color,
    };
    if (editId) store.updateGoal(editId, payload);
    else store.addGoal(payload);
    closeForm();
  };

  const contribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeId) return;
    const amt = Number(contributeAmt);
    if (!amt) return;
    const goal = store.goals.find((g) => g.id === contributeId);
    if (!goal) return;
    store.updateGoal(contributeId, { saved: Math.min(goal.target, goal.saved + amt) });
    setContributeId(null);
    setContributeAmt('');
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Hedefler</h1>
          <p className="subtitle">Birikim yolculuğun</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus size={18} />
          Hedef oluştur
        </button>
      </div>

      <div className="grid-3">
        {store.goals.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty">
              <strong>Hedef yok</strong>
              Tatil, acil fon veya hayalin için bir hedef ekle.
            </div>
          </div>
        ) : (
          store.goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <div key={g.id} className="goal-card" style={{ ['--accent' as string]: g.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{g.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                      Son tarih {formatShortDate(g.deadline)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)} aria-label="Düzenle">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => store.deleteGoal(g.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="goal-pct" style={{ margin: '18px 0 8px', color: g.color }}>
                  %{pct}
                </div>
                <div className="budget-bar">
                  <span style={{ width: `${pct}%`, background: g.color }} />
                </div>
                <div className="budget-meta" style={{ marginTop: 8, marginBottom: 14 }}>
                  <span>{formatMoney(g.saved, store.settings)}</span>
                  <span>{formatMoney(g.target, store.settings)}</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setContributeId(g.id)}
                >
                  Birikim ekle
                </button>
              </div>
            );
          })
        )}
      </div>

      <Modal open={open} title={editId ? 'Hedefi düzenle' : 'Yeni hedef'} onClose={closeForm}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Hedef adı</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Hedef tutar</label>
              <input type="number" min="1" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div className="field">
              <label>Şu an biriken</label>
              <input type="number" min="0" value={form.saved} onChange={(e) => setForm({ ...form, saved: e.target.value })} />
            </div>
            <div className="field full">
              <label>Son tarih</label>
              <input type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="field full">
              <label>Renk</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: c,
                      outline: form.color === c ? '3px solid var(--ink)' : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeForm}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!contributeId} title="Birikim ekle" onClose={() => setContributeId(null)}>
        <form onSubmit={contribute}>
          <div className="field">
            <label>Tutar (₺)</label>
            <input type="number" min="1" required value={contributeAmt} onChange={(e) => setContributeAmt(e.target.value)} autoFocus />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setContributeId(null)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary">Ekle</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
