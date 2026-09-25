import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import type { AdviceLevel } from '../types';
import { buildAdvice } from '../utils/advice';

const ICONS: Record<AdviceLevel, typeof Info> = {
  good: CheckCircle2,
  tip: Lightbulb,
  warn: AlertTriangle,
  alert: AlertTriangle,
};

export function Advice({ store }: { store: BudgetStore }) {
  const items = useMemo(() => buildAdvice(store), [store]);

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Tavsiyeler</h1>
          <p className="subtitle">Verilerine göre kişiselleştirilmiş ekonomi önerileri</p>
        </div>
      </div>

      <div className="advice-list">
        {items.map((item) => {
          const Icon = ICONS[item.level];
          return (
            <article key={item.id} className={`advice-card advice-${item.level}`}>
              <div className="advice-icon">
                <Icon size={20} />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
