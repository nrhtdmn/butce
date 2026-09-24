import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney, monthLabel } from '../utils/format';

export function Reports({ store }: { store: BudgetStore }) {
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of store.monthTx.filter((x) => x.type === 'expense')) {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return Object.entries(map)
      .map(([id, value]) => {
        const cat = store.categories.find((c) => c.id === id);
        return { name: cat?.name ?? '?', value, color: cat?.color ?? '#888' };
      })
      .sort((a, b) => b.value - a.value);
  }, [store.monthTx, store.categories]);

  const weekly = useMemo(() => {
    const buckets = [
      { name: '1-7', gider: 0, gelir: 0 },
      { name: '8-14', gider: 0, gelir: 0 },
      { name: '15-21', gider: 0, gelir: 0 },
      { name: '22+', gider: 0, gelir: 0 },
    ];
    for (const t of store.monthTx) {
      const day = Number(t.date.slice(8));
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      if (t.type === 'expense') buckets[idx].gider += t.amount;
      else buckets[idx].gelir += t.amount;
    }
    return buckets;
  }, [store.monthTx]);

  const avgDaily =
    store.expense > 0
      ? Math.round(store.expense / Math.max(1, new Date().getDate()))
      : 0;

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Raporlar</h1>
          <p className="subtitle">{monthLabel(store.month)} analizi</p>
        </div>
      </div>

      <div className="report-kpis">
        <div className="kpi">
          <span>Net nakit</span>
          <strong style={{ color: store.income - store.expense >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
            {formatMoney(store.income - store.expense, store.settings)}
          </strong>
        </div>
        <div className="kpi">
          <span>Günlük ortalama gider</span>
          <strong>{formatMoney(avgDaily, store.settings)}</strong>
        </div>
        <div className="kpi">
          <span>En büyük kategori</span>
          <strong>{byCategory[0]?.name ?? '—'}</strong>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Kategori dağılımı</div>
          {byCategory.length === 0 ? (
            <div className="empty">
              <strong>Veri yok</strong>
              Bu ay gider kaydı bulunamadı.
            </div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {byCategory.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v), store.settings)}
                      contentStyle={{ borderRadius: 12, border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row">
                {byCategory.map((e) => (
                  <div key={e.name} className="legend-item">
                    <span className="legend-swatch" style={{ background: e.color }} />
                    {e.name} · {formatMoney(e.value, store.settings)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Haftalık karşılaştırma</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,31,26,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip
                  formatter={(v) => formatMoney(Number(v), store.settings)}
                  contentStyle={{ borderRadius: 12, border: 'none' }}
                />
                <Bar dataKey="gelir" fill="#1B6B5A" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gider" fill="#E76F51" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
