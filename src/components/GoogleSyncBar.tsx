import React from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Link, 
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { SyncStatus } from '../services/googleSyncService';

interface GoogleSyncBarProps {
  syncStatus: SyncStatus;
  onOpenSyncModal: () => void;
  onManualSync: () => void;
  onToggleAutoSync: () => void;
}

export const GoogleSyncBar: React.FC<GoogleSyncBarProps> = ({
  syncStatus,
  onOpenSyncModal,
  onManualSync,
  onToggleAutoSync
}) => {
  return (
    <div className={`p-4 rounded-2xl border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      syncStatus.isConnected 
        ? 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-300' 
        : 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-white border-amber-300'
    }`}>
      {/* Left: Status info */}
      <div className="flex items-start sm:items-center gap-3">
        <div className={`p-2.5 rounded-xl shadow-xs flex-shrink-0 ${
          syncStatus.isConnected 
            ? 'bg-emerald-600 text-white' 
            : 'bg-amber-500 text-white'
        }`}>
          <Database className="w-5 h-5" />
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              {syncStatus.isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-950">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                  Terhubung Langsung ke Google Sheets
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Mode Lokal: Belum Terhubung ke URL Google Apps Script
                </span>
              )}
            </h3>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              syncStatus.isConnected 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {syncStatus.isConnected ? 'Google Cloud Live DB' : 'Perlu Konfigurasi URL Web App'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-normal">
            {syncStatus.isConnected ? (
              <span>
                Data sinkron dua arah secara real-time. {syncStatus.lastSyncedAt ? `Terakhir diperbarui: ${syncStatus.lastSyncedAt}` : 'Siap sinkronisasi.'}
              </span>
            ) : (
              <span>
                Data yang diinput admin di komputer lain belum tersinkron otomatis ke sini. Klik tombol di kanan untuk menghubungkan URL Google Apps Script.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
        {syncStatus.isConnected ? (
          <>
            {/* Auto-sync toggle */}
            <button
              onClick={onToggleAutoSync}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                syncStatus.autoSync 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Perbarui otomatis data setiap 30 detik"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Sync: {syncStatus.autoSync ? 'Aktif (30s)' : 'Mati'}</span>
            </button>

            {/* Sync Now button */}
            <button
              onClick={onManualSync}
              disabled={syncStatus.isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
              <span>{syncStatus.isLoading ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenSyncModal}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm shadow-amber-600/30 transition flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Hubungkan ke Google Sheets</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSyncModal}
          title="Pengaturan Koneksi Google Apps Script"
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
