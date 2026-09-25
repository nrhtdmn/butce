import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { BudgetStore } from '../hooks/useBudgetStore';
import { downloadBackup, readBackupFile } from '../utils/backup';

export function Settings({ store }: { store: BudgetStore }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onExport = () => {
    downloadBackup(store.getExportState());
    setMessage('Yedek indirildi.');
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = await readBackupFile(file);
      const ok = confirm(
        'İçe aktarma mevcut tüm verilerin üzerine yazacak. Devam edilsin mi?',
      );
      if (!ok) return;
      store.importState(data);
      setMessage('Yedek başarıyla içe aktarıldı.');
    } catch {
      setMessage('Geçersiz veya bozuk yedek dosyası.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
        <div className="panel-title">Yedekleme</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14 }}>
          Tüm hareketler, kategoriler, bütçeler, hedefler ve ayarları JSON dosyası olarak
          dışa aktarabilir veya daha önce aldığın yedeği içe aktarabilirsin.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button className="btn btn-primary" type="button" onClick={onExport}>
            <Download size={16} />
            Dışa aktar
          </button>
          <button className="btn btn-ghost" type="button" onClick={onImportClick}>
            <Upload size={16} />
            İçe aktar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
        </div>
        {message && (
          <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--teal)' }}>{message}</p>
        )}
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
          Tüm hareket, kategori, bütçe, hedef, borç, alacak, taksit ve faturaları siler;
          bakiyeyi sıfırlar. Bu işlem geri alınamaz.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Tüm veriler silinip her şey sıfırlansın mı?')) {
              store.resetData();
              setMessage(null);
            }
          }}
        >
          Verileri sıfırla
        </button>
      </div>
    </div>
  );
}
