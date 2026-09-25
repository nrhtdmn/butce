import type { AdviceItem, AppState } from '../types';

export type AdviceInput = Pick<
  AppState,
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'debts'
  | 'receivables'
  | 'installments'
  | 'settings'
> & {
  month: string;
  income: number;
  expense: number;
  balance: number;
  spentByCategory: (categoryId: string, forMonth?: string) => number;
};

export function buildAdvice(store: AdviceInput): AdviceItem[] {
  const items: AdviceItem[] = [];
  const {
    income,
    expense,
    balance,
    budgets,
    categories,
    goals,
    debts,
    receivables,
    installments,
    month,
    spentByCategory,
    settings,
  } = store;

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const activeDebts = debts.filter((d) => d.status === 'active');
  const activeRecv = receivables.filter((r) => r.status === 'active');
  const activeInst = installments.filter((i) => i.status === 'active');
  const debtTotal = activeDebts.reduce((s, d) => s + d.remaining, 0);
  const recvTotal = activeRecv.reduce((s, r) => s + r.remaining, 0);
  const monthlyInst = activeInst.reduce((s, i) => s + i.monthlyAmount, 0);

  if (income === 0 && expense === 0) {
    items.push({
      id: 'start',
      level: 'tip',
      title: 'İlk adımı at',
      body: 'Gelir ve gider ekleyerek başla. Düzenli kayıt, doğru tavsiyenin temelidir.',
    });
  }

  if (income > 0 && savingsRate >= 20) {
    items.push({
      id: 'save-good',
      level: 'good',
      title: `Tasarruf oranın %${Math.round(savingsRate)}`,
      body: 'İyi gidiyorsun. Fazlayı acil fon veya düşük riskli birikime yönlendirebilirsin.',
    });
  } else if (income > 0 && savingsRate < 10) {
    items.push({
      id: 'save-low',
      level: 'warn',
      title: 'Tasarruf oranı düşük',
      body: 'Hedef: gelirinin en az %10–20’sini ayır. Kafe/eğlence kalemlerini gözden geçir.',
    });
  }

  if (expense > income && income > 0) {
    items.push({
      id: 'deficit',
      level: 'alert',
      title: 'Bu ay açık var',
      body: 'Giderler gelirini aşıyor. Önce zorunlu olmayan harcamaları kıs, sonra borç ödemesine odaklan.',
    });
  }

  for (const b of budgets.filter((x) => x.month === month)) {
    const spent = spentByCategory(b.categoryId);
    const cat = categories.find((c) => c.id === b.categoryId);
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    if (pct >= 100) {
      items.push({
        id: `budget-over-${b.id}`,
        level: 'alert',
        title: `${cat?.name ?? 'Kategori'} bütçesi aşıldı`,
        body: `Limit ${Math.round(b.limit).toLocaleString(settings.locale)} iken harcama ${Math.round(spent).toLocaleString(settings.locale)}. Gelecek ay limiti veya harcamayı ayarla.`,
      });
    } else if (pct >= 80) {
      items.push({
        id: `budget-warn-${b.id}`,
        level: 'warn',
        title: `${cat?.name ?? 'Kategori'} limitine yaklaşıldı`,
        body: `Bütçenin %${Math.round(pct)}’i kullanıldı. Ay sonuna dikkat et.`,
      });
    }
  }

  if (debtTotal > 0) {
    const ratio = income > 0 ? (debtTotal / income) * 100 : 0;
    items.push({
      id: 'debt-focus',
      level: ratio > 50 ? 'alert' : 'tip',
      title: 'Borç yönetimi',
      body:
        ratio > 50
          ? `Toplam borcun (${Math.round(debtTotal).toLocaleString(settings.locale)}) aylık gelirinin yarısından fazla. Önce faizlisi olanı kapat.`
          : `Aktif borç bakiyen ${Math.round(debtTotal).toLocaleString(settings.locale)}. Mümkünse asgari yerine fazla ödeme yap.`,
    });
  }

  const highInterest = activeDebts.filter((d) => d.interestRate >= 2);
  if (highInterest.length) {
    items.push({
      id: 'interest',
      level: 'warn',
      title: 'Yüksek faizli borç var',
      body: `${highInterest.map((d) => d.title).join(', ')} için faiz yükü artıyor. Öncelikli ödeme planı çıkar.`,
    });
  }

  if (recvTotal > 0) {
    items.push({
      id: 'recv',
      level: 'tip',
      title: 'Alacaklarını takip et',
      body: `${Math.round(recvTotal).toLocaleString(settings.locale)} alacağın görünüyor. Vadesi yaklaşanları hatırlat.`,
    });
  }

  if (monthlyInst > 0) {
    const load = income > 0 ? (monthlyInst / income) * 100 : 0;
    items.push({
      id: 'install',
      level: load > 30 ? 'warn' : 'tip',
      title: 'Taksit yükü',
      body:
        load > 30
          ? `Aylık taksitlerin gelirinin %${Math.round(load)}’i. Yeni taksit açmadan önce bu yükü düşür.`
          : `Bu ay taksit ödenecek tutar yaklaşık ${Math.round(monthlyInst).toLocaleString(settings.locale)}.`,
    });
  }

  const soonInst = activeInst.filter((i) => {
    const due = new Date(i.nextDueDate + 'T12:00:00');
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  if (soonInst.length) {
    items.push({
      id: 'due-soon',
      level: 'warn',
      title: 'Yaklaşan taksit',
      body: `${soonInst.map((i) => i.title).join(', ')} için 7 gün içinde ödeme var.`,
    });
  }

  if (goals.length === 0) {
    items.push({
      id: 'goal-missing',
      level: 'tip',
      title: 'Bir hedef koy',
      body: 'Acil fon (3–6 aylık gider) veya somut bir birikim hedefi motivasyonu artırır.',
    });
  } else {
    const emergency = goals.find((g) => /acil|fon/i.test(g.name));
    if (emergency && emergency.saved < emergency.target * 0.5) {
      items.push({
        id: 'emergency',
        level: 'tip',
        title: 'Acil fonu güçlendir',
        body: 'Beklenmedik giderler için fonun en az yarısını doldurmayı hedefle.',
      });
    }
  }

  if (balance < 0) {
    items.push({
      id: 'neg-bal',
      level: 'alert',
      title: 'Negatif bakiye',
      body: 'Net bakiyen eksi. Yeni borç almadan gelir-gider dengesini düzelt.',
    });
  }

  items.push({
    id: 'rule50',
    level: 'tip',
    title: '50/30/20 kuralı',
    body: 'Gelirin %50’si ihtiyaç, %30’u istek, %20’si birikim/borç. Oranlarını buna yaklaştırmayı dene.',
  });

  items.push({
    id: 'inflate',
    level: 'tip',
    title: 'Enflasyona karşı',
    body: 'Nakit fazlanı sadece hesapta tutma; acil fon sonrası uzun vadeli birikim araçlarını araştır.',
  });

  items.push({
    id: 'track',
    level: 'tip',
    title: 'Küçük kaçakları yakala',
    body: 'Abonelik, kahve ve mini alışverişler ay sonunda büyük tutar oluşturur. Haftalık kontrol et.',
  });

  const order = { alert: 0, warn: 1, tip: 2, good: 3 } as const;
  return items.sort((a, b) => order[a.level] - order[b.level]);
}
