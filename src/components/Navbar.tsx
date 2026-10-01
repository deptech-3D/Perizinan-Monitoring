import React, { useState } from 'react';
import { 
  FileText, 
  Bell, 
  User, 
  Grid2X2, 
  BarChart2, 
  Users, 
  Code2, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Settings,
  Database,
  Home
} from 'lucide-react';
import { UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  h60Count: number;
  expiredCount: number;
  syncStatus?: { isConnected: boolean; isLoading: boolean; lastSyncedAt: string | null };
  onOpenSyncModal?: () => void;
  onManualSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  h60Count,
  expiredCount,
  syncStatus,
  onOpenSyncModal,
  onManualSync
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const urgentCount = h60Count + expiredCount;

  return (
    <header className="sticky top-0 z-40 bg-[#12429a] shadow-md">
      {/* 1. Main Top Royal Blue Header */}
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between text-white">
        
        {/* Left: App Icon & Title */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-400/40 shadow-md shadow-blue-900/30 flex-shrink-0 group-hover:scale-105 transition bg-[#0a2558]">
            <img src="/pwa-192x192.png" alt="Logo Perizinan Hotel" className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-tight text-white leading-none">
                PERIZINAN
              </h1>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#2563eb] text-white border border-blue-300/30 shadow-xs">
                HOTEL
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-1 font-normal leading-none">
              Sistem Monitoring Legalitas
            </p>
          </div>
        </div>

        {/* Right: PWA Install, Notifications & User Avatar */}
        <div className="flex items-center gap-2.5 relative">
          {/* PWA Install Button for PC & Mobile */}
          <PWAInstallButton variant="navbar" />

          {/* Notification Bell with Badge */}
          <button 
            onClick={() => setActiveTab('reminder-simulator')}
            title="Pemberitahuan Notifikasi H-60"
            className="relative p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {urgentCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 flex items-center justify-center transition cursor-pointer text-white"
              title={`${currentUser.fullName} (${currentUser.role})`}
            >
              <User className="w-5 h-5" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 text-xs animate-in fade-in-50">
                <div className="p-3 bg-slate-50 rounded-xl mb-1">
                  <p className="font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">{currentUser.username}</span>
                  </div>
                </div>

                {onOpenSyncModal && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSyncModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-2"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>Koneksi Google Sheets</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Keluar / Ganti Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. Sub-Navigation Tabs Bar (Scrollable horizontally) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          
          {/* Tab 0: Beranda */}
          <button
            onClick={() => setActiveTab('home')}
            className={`py-2 px-3 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'home'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          {/* Tab 1: Data Perizinan */}
          <button
            onClick={() => setActiveTab('licenses')}
            className={`py-2 px-3 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'licenses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
            <span>Data Perizinan ({urgentCount})</span>
          </button>

          {/* Tab 2: Simulasi H-60 */}
          <button
            onClick={() => setActiveTab('reminder-simulator')}
            className={`py-2 px-3 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'reminder-simulator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Simulasi H-60</span>
          </button>

          {/* Tab 3: Users (Admin only) */}
          {currentUser.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-3 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}

          {/* Tab 4: Kode & Panduan */}
          <button
            onClick={() => setActiveTab('code-export')}
            className={`py-2 px-3 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'code-export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode & Panduan</span>
          </button>

        </div>
      </div>
    </header>
  );
};
