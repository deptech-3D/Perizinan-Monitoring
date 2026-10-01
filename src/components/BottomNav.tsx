import React, { useState } from 'react';
import { 
  Home, 
  FileText, 
  BarChart2, 
  MoreHorizontal, 
  Users, 
  Code2, 
  Settings, 
  LogOut, 
  X,
  Database,
  RotateCcw,
  Download
} from 'lucide-react';
import { UserAccount } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  onOpenSyncModal: () => void;
  onResetData: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenSyncModal,
  onResetData
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Bottom Sheet Menu for "Lainnya" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-blue-200 bg-[#0a2558] flex-shrink-0 shadow-xs">
                  <img src="/pwa-192x192.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">PERIZINAN HOTEL</h3>
                  <p className="text-[11px] text-slate-500">Cloud Legal Monitoring</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  const installBtn = document.querySelector('[title*="Install Aplikasi"]') as HTMLElement;
                  if (installBtn) installBtn.click();
                }}
                className="p-3 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition flex items-center gap-2.5 group cursor-pointer col-span-2 shadow-xs"
              >
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">Install Aplikasi ke Layar HP / PC</p>
                  <p className="text-[10px] text-blue-700">Pasang dengan logo resmi hotel di layar utama</p>
                </div>
              </button>
              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => handleNav('users')}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Manajemen Users</p>
                    <p className="text-[10px] text-slate-500">Kelola akun & hak akses</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleNav('code-export')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Kode & Panduan</p>
                  <p className="text-[10px] text-slate-500">Code.gs & deployment</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenSyncModal();
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Koneksi Sheets</p>
                  <p className="text-[10px] text-slate-500">URL Apps Script Web App</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onResetData();
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Reset Demo</p>
                  <p className="text-[10px] text-slate-500">Kembalikan data default</p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Login sebagai: <strong className="text-slate-800">{currentUser.fullName}</strong>
              </div>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-4 shadow-lg shadow-slate-900/10 max-w-xl mx-auto">
        <div className="flex items-center justify-around">
          
          {/* 1. Beranda */}
          <button
            onClick={() => handleNav('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              activeTab === 'home'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Beranda</span>
          </button>

          {/* 2. Data Perizinan */}
          <button
            onClick={() => handleNav('licenses')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              activeTab === 'licenses'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Data Perizinan</span>
          </button>

          {/* 3. Simulasi H-60 */}
          <button
            onClick={() => handleNav('reminder-simulator')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              activeTab === 'reminder-simulator'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px]">Simulasi H-60</span>
          </button>

          {/* 4. Lainnya */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              ['users', 'code-export'].includes(activeTab) || showMoreMenu
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">Lainnya</span>
          </button>

        </div>
      </nav>
    </>
  );
};
