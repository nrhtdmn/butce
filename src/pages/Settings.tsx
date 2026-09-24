import type { BudgetStore } from '../hooks/useBudgetStore';

export function Settings({ store }: { store: BudgetStore }) {
  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <h1>Ayarlar</h1>
          <p className="subtitle">Profil ve veri yönetimi</p>
        </div>
      </div>

      <div className="panel settings-block">
        <div className="panel-title">Profil</div>
        <div className="form-grid">
          <div className="field full">
            <label>Görünen ad</label>
            <input
              value={store.settings.name}
              onChange={(e) => store.updateSettings({ name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Para birimi</label>
            <select
              value={store.settings.currency}
              onChange={(e) => store.updateSettings({ currency: e.target.value })}
            >
              <option value="TRY">TRY — Türk Lirası</option>
              <option value="USD">USD — Dolar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Sterlin</option>
            </select>
          </div>
          <div className="field">
            <label>Başlangıç bakiyesi</label>
            <input
              type="number"
              value={store.settings.startBalance}
              onChange={(e) =>
                store.updateSettings({ startBalance: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
      </div>

      <div className="panel settings-block">
        <div className="panel-title">Uygulama (PWA)</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
          DENGE bir Progressive Web App’tir. Tarayıcıdan “Yükle / Ana ekrana ekle”
          ile uygulama gibi kullanabilir, çevrimdışı erişebilirsin.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {typeof navigator !== 'undefined' && 'serviceWorker' in navigator
            ? '✓ Bu tarayıcı PWA destekliyor'
            : 'Bu tarayıcıda PWA sınırlı olabilir'}
        </p>
      </div>

      <div className="panel settings-block">
        <div className="panel-title">Hakkında</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>DENGE</strong>,
          gelir-giderlerini, bütçe limitlerini ve birikim hedeflerini tek yerde tutman için
          tasarlandı. Verilerin tarayıcında (localStorage) saklanır — sunucuya gitmez.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 14 }}>
          <a
            href="https://www.instagram.com/nurhatduman/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--teal)', fontWeight: 600 }}
          >
            Nurhat DUMAN
          </a>{' '}
          tarafından üretilmiştir
        </p>
      </div>

      <div className="panel settings-block danger-zone">
        <div className="panel-title">Tehlikeli alan</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 14 }}>
          Tüm verileri örnek verilere sıfırlar. Bu işlem geri alınamaz.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Tüm veriler silinip örnek verilere dönülsün mü?')) {
              store.resetData();
            }
          }}
        >
          Verileri sıfırla
        </button>
      </div>
    </div>
  );
}
