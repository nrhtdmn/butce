import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney } from '../utils/format';

export function LiabilitySummary({ store }: { store: BudgetStore }) {
  return (
    <div className="finance-strip" style={{ marginBottom: 16 }}>
      <div className="finance-chip">
        <div>
          <span>Toplam yükümlülük</span>
          <strong>{formatMoney(store.totalLiabilities, store.settings)}</strong>
        </div>
      </div>
      <div className="finance-chip">
        <div>
          <span>Borçlar</span>
          <strong>{formatMoney(store.totalDebt, store.settings)}</strong>
        </div>
      </div>
      <div className="finance-chip">
        <div>
          <span>Kalan taksit</span>
          <strong>{formatMoney(store.installmentDebt, store.settings)}</strong>
        </div>
      </div>
      <div className="finance-chip">
        <div>
          <span>Bekleyen fatura</span>
          <strong>{formatMoney(store.totalBillsDue, store.settings)}</strong>
        </div>
      </div>
      <div className="finance-chip">
        <div>
          <span>Alacaklar</span>
          <strong>{formatMoney(store.totalReceivable, store.settings)}</strong>
        </div>
      </div>
      <div className="finance-chip">
        <div>
          <span>Aylık taksit yükü</span>
          <strong>{formatMoney(store.monthlyInstallments, store.settings)}</strong>
        </div>
      </div>
    </div>
  );
}
