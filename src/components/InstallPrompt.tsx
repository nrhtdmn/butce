import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'denge-pwa-dismiss';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Uygulamayı yükle">
      <div className="install-banner-text">
        <strong>DENGE’yi yükle</strong>
        <span>Ana ekrana ekle, çevrimdışı kullan</span>
      </div>
      <div className="install-banner-actions">
        <button className="btn btn-primary btn-sm" onClick={install}>
          <Download size={14} />
          Yükle
        </button>
        <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Kapat">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
