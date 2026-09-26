import { motion } from 'framer-motion';
import {
  HandCoins,
  WalletCards,
  CalendarClock,
  FileText,
  Scale,
  ListOrdered,
} from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { formatMoney } from '../utils/format';

type Variant = 'debts' | 'receivables' | 'installments' | 'bills';

export function PageHeroStats({
  store,
  variant,
}: {
  store: BudgetStore;
  variant: Variant;
}) {
  const activeDebts = store.debts.filter((d) => d.status === 'active').length;
  const activeRecv = store.receivables.filter((r) => r.status === 'active').length;
  const activeInst = store.installments.filter((i) => i.status === 'active').length;
  const pendingBills = store.bills.filter((b) => b.status === 'pending').length;

  const cards =
    variant === 'debts'
      ? [
          {
            className: 'stat-balance',
            label: 'Toplam borç',
            icon: HandCoins,
            value: formatMoney(store.totalDebt, store.settings),
            hint: `${activeDebts} aktif kayıt`,
          },
          {
            className: 'stat-expense',
            label: 'Kalan taksit',
            icon: CalendarClock,
            value: formatMoney(store.installmentDebt, store.settings),
            hint: `Aylık ${formatMoney(store.monthlyInstallments, store.settings)}`,
          },
          {
            className: 'stat-rate',
            label: 'Bekleyen fatura',
            icon: FileText,
            value: formatMoney(store.totalBillsDue, store.settings),
            hint: `${pendingBills} ödeme`,
          },
          {
            className: 'stat-income',
            label: 'Toplam yükümlülük',
            icon: Scale,
            value: formatMoney(store.totalLiabilities, store.settings),
            hint: 'Borç + taksit + fatura',
          },
        ]
      : variant === 'receivables'
        ? [
            {
              className: 'stat-balance',
              label: 'Toplam alacak',
              icon: WalletCards,
              value: formatMoney(store.totalReceivable, store.settings),
              hint: `${activeRecv} aktif kayıt`,
            },
            {
              className: 'stat-income',
              label: 'Tahsil edilen',
              icon: WalletCards,
              value: formatMoney(
                store.receivables.reduce((s, r) => s + (r.total - r.remaining), 0),
                store.settings,
              ),
              hint: 'Şimdiye kadar',
            },
            {
              className: 'stat-expense',
              label: 'Toplam borç',
              icon: HandCoins,
              value: formatMoney(store.totalDebt, store.settings),
              hint: 'Karşılaştırma',
            },
            {
              className: 'stat-rate',
              label: 'Net (alacak − borç)',
              icon: Scale,
              value: formatMoney(store.totalReceivable - store.totalDebt, store.settings),
              hint: 'Borç sonrası fark',
            },
          ]
        : variant === 'installments'
          ? [
              {
                className: 'stat-balance',
                label: 'Toplam taksit tutarı',
                icon: CalendarClock,
                value: formatMoney(store.installmentDebt, store.settings),
                hint: `${activeInst} aktif plan`,
              },
              {
                className: 'stat-expense',
                label: 'Aylık taksit yükü',
                icon: ListOrdered,
                value: formatMoney(store.monthlyInstallments, store.settings),
                hint: 'Her ay ödenecek',
              },
              {
                className: 'stat-income',
                label: 'Ödenen taksit',
                icon: CalendarClock,
                value: formatMoney(
                  store.installments.reduce(
                    (s, i) => s + i.paidCount * i.monthlyAmount,
                    0,
                  ),
                  store.settings,
                ),
                hint: 'Şimdiye kadar',
              },
              {
                className: 'stat-rate',
                label: 'Toplam borç',
                icon: HandCoins,
                value: formatMoney(store.totalDebt, store.settings),
                hint: 'Borçlar menüsü',
              },
            ]
          : [
              {
                className: 'stat-balance',
                label: 'Bekleyen fatura',
                icon: FileText,
                value: formatMoney(store.totalBillsDue, store.settings),
                hint: `${pendingBills} ödeme`,
              },
              {
                className: 'stat-expense',
                label: 'Toplam borç',
                icon: HandCoins,
                value: formatMoney(store.totalDebt, store.settings),
                hint: `${activeDebts} aktif`,
              },
              {
                className: 'stat-rate',
                label: 'Kalan taksit',
                icon: CalendarClock,
                value: formatMoney(store.installmentDebt, store.settings),
                hint: `Aylık ${formatMoney(store.monthlyInstallments, store.settings)}`,
              },
              {
                className: 'stat-income',
                label: 'Toplam yükümlülük',
                icon: Scale,
                value: formatMoney(store.totalLiabilities, store.settings),
                hint: 'Borç + taksit + fatura',
              },
            ];

  return (
    <div className="grid-stats">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            className={`stat ${c.className}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (i + 1) }}
          >
            <div className="stat-label">
              <Icon size={16} /> {c.label}
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-hint">{c.hint}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** @deprecated use PageHeroStats */
export function LiabilitySummary({ store }: { store: BudgetStore }) {
  return <PageHeroStats store={store} variant="debts" />;
}
