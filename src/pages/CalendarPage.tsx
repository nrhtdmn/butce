import { useMemo, useState } from 'react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney, formatShortDate } from '../utils/format';

const KIND_COLOR: Record<string, string> = {
  debt: '#E76F51',
  receivable: '#2A9D8F',
  installment: '#457B9D',
  bill: '#E9C46A',
};

const KIND_LABEL: Record<string, string> = {
  debt: 'Borç',
  receivable: 'Alacak',
  installment: 'Taksit',
  bill: 'Fatura',
};

export function CalendarPage({ store }: { store: BudgetStore }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [selected, setSelected] = useState<string | null>(null);

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

  const monthEvents = useMemo(
    () => store.calendarEvents.filter((e) => e.date.startsWith(ym)),
    [store.calendarEvents, ym],
  );

  const byDate = useMemo(() => {
    const map: Record<string, typeof monthEvents> = {};
    for (const e of monthEvents) {
      (map[e.date] ??= []).push(e);
    }
    return map;
  }, [monthEvents]);

  const selectedEvents = selected ? byDate[selected] ?? [] : [];

  const upcoming = store.calendarEvents
    .filter((e) => e.date >= now.toISOString().slice(0, 10))
    .slice(0, 8);

  const prev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelected(null);
  };

  const next = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelected(null);
  };

  const monthTitle = new Date(year, month, 1).toLocaleDateString(store.settings.locale, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Ödeme takvimi</h1>
          <p className="subtitle">Borç, fatura, ekstre ve taksit vadeleri</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">
            <span style={{ textTransform: 'capitalize' }}>{monthTitle}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={prev}>‹</button>
              <button className="btn btn-ghost btn-sm" onClick={next}>›</button>
            </div>
          </div>

          <div className="cal-weekdays">
            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`e-${i}`} className="cal-cell empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = `${ym}-${String(day).padStart(2, '0')}`;
              const events = byDate[date] ?? [];
              const isToday = date === now.toISOString().slice(0, 10);
              return (
                <button
                  key={date}
                  type="button"
                  className={`cal-cell ${selected === date ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelected(date)}
                >
                  <span className="cal-day">{day}</span>
                  <span className="cal-dots">
                    {events.slice(0, 3).map((e) => (
                      <i key={e.id} style={{ background: KIND_COLOR[e.kind] }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="legend-row" style={{ marginTop: 14 }}>
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <div key={k} className="legend-item">
                <span className="legend-swatch" style={{ background: KIND_COLOR[k] }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            {selected ? formatShortDate(selected) : 'Yaklaşan ödemeler'}
          </div>
          <ul className="tx-list">
            {(selected ? selectedEvents : upcoming).length === 0 ? (
              <div className="empty">
                <strong>Kayıt yok</strong>
                Bu tarihte ödeme görünmüyor.
              </div>
            ) : (
              (selected ? selectedEvents : upcoming).map((e) => (
                <li key={e.id} className="tx-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                  <div
                    className="tx-icon"
                    style={{ background: KIND_COLOR[e.kind], width: 36, height: 36, borderRadius: 10 }}
                  />
                  <div className="tx-meta">
                    <strong>{e.title}</strong>
                    <span>
                      {KIND_LABEL[e.kind]} · {formatShortDate(e.date)}
                    </span>
                  </div>
                  <div className={`tx-amount ${e.kind === 'receivable' ? 'income' : 'expense'}`}>
                    {formatMoney(e.amount, store.settings)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
