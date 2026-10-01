import React, { useState } from 'react';
import { Download, Smartphone, Monitor, X, Share, PlusSquare, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'login';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running inside standalone app, do not show install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'login') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full mt-3 py-2.5 px-4 bg-slate-900/80 hover:bg-slate-900 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700/60 shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer group"
        >
          <img src="/pwa-192x192.png" alt="Logo" className="w-5 h-5 rounded-md object-cover shadow-xs" />
          <span>Pasang / Install Aplikasi di HP & PC</span>
          <Download className="w-3.5 h-3.5 text-blue-400 group-hover:translate-y-0.5 transition" />
        </button>

        {showGuide && (
          <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
        title="Install Aplikasi di Layar Utama HP atau Komputer"
      >
        <img src="/pwa-192x192.png" alt="App Logo" className="w-4 h-4 rounded object-cover shadow-xs" />
        <span className="hidden sm:inline">Install di HP / PC</span>
        <span className="sm:hidden">Install</span>
        <Download className="w-3.5 h-3.5 text-blue-200" />
      </button>

      {showGuide && (
        <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

const InstallGuideModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-blue-500/20 mb-3 bg-slate-900">
            <img src="/pwa-512x512.png" alt="Logo Perizinan Hotel" className="w-full h-full object-cover" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Install Aplikasi PERIZINAN HOTEL
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan aplikasi langsung dari layar utama HP & PC Anda dengan logo resmi hotel.
          </p>

          <div className="w-full mt-4 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
            {isIOS ? (
              <>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                  <span>Buka website ini di browser <strong>Safari</strong> pada iPhone/iPad.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                  <span className="flex items-center gap-1">Tekan tombol <strong>Share</strong> <Share className="w-3.5 h-3.5 text-blue-600 inline" /> di toolbar bawah Safari.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                  <span className="flex items-center gap-1">Pilih <strong>Tambahkan ke Layar Utama</strong> (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Di HP Android:</strong> Tekan menu titik tiga (&bull;&bull;&bull;) di kanan atas Chrome &rarr; pilih <strong>"Install Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Di Komputer / Laptop (PC):</strong> Klik ikon install <Download className="w-3.5 h-3.5 text-indigo-600 inline" /> di bilah alamat browser Chrome/Edge &rarr; pilih <strong>"Install SIMPERIZINAN"</strong>.</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full mt-4 flex items-center justify-center gap-2 text-[11px] text-emerald-600 font-semibold bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Ikon logo hotel akan otomatis tampil di layar utama</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
