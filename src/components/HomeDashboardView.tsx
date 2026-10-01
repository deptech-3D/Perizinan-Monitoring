import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Laptop, 
  Lightbulb, 
  FileCheck,
  Building2,
  BellRing
} from 'lucide-react';
import { LicenseItem, UserAccount } from '../types';
import { calculateRemainingDays, formatDateIndo, getHumanDuration } from '../utils/licenseUtils';
import { SyncStatus } from '../services/googleSyncService';

interface HomeDashboardViewProps {
  licenses: LicenseItem[];
  currentUser: UserAccount;
  syncStatus: SyncStatus;
  onSelectLicense: (license: LicenseItem) => void;
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenSyncModal: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  licenses,
  currentUser,
  syncStatus,
  onSelectLicense,
  onNavigateTab,
  onOpenSyncModal
}) => {
  // Compute counts
  const stats = React.useMemo(() => {
    let warningCount = 0;
    let expiredCount = 0;
    let safeCount = 0;
    let completedCount = 0;

    licenses.forEach((item) => {
      if (item.status === 'Selesai') {
        completedCount++;
        return;
      }
      const days = calculateRemainingDays(item.expiryDate);
      if (days < 0) {
        expiredCount++;
      } else if (days <= 60) {
        warningCount++;
      } else {
        safeCount++;
      }
    });

    return {
      total: licenses.length,
      warningCount,
      expiredCount,
      safeCount,
      completedCount,
      urgentTotal: warningCount + expiredCount
    };
  }, [licenses]);

  // Urgent list sorted by days remaining
  const urgentLicenses = React.useMemo(() => {
    return licenses
      .filter((item) => {
        if (item.status === 'Selesai') return false;
        const days = calculateRemainingDays(item.expiryDate);
        return days <= 60; // H-60 or expired
      })
      .sort((a, b) => calculateRemainingDays(a.expiryDate) - calculateRemainingDays(b.expiryDate));
  }, [licenses]);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10">

      {/* 1. Status Bar Card: Sistem Terhubung */}
      <div 
        onClick={onOpenSyncModal}
        className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
              <span>Sistem Terhubung</span>
              {syncStatus.isConnected && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                  Sheets Live
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Multi-User Concurrent Ready (Bisa dibuka di &ge; 2 Komputer)
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
          <Laptop className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Welcome Banner with Official Hotel Permit Logo */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-5 border border-blue-700/40 shadow-lg relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1.5 z-10 max-w-[62%]">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 inline-block uppercase tracking-wider">
            Hotel Engineering & Legal
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            PERIZINAN HOTEL
          </h2>
          <p className="text-xs text-blue-100/90 leading-snug">
            Monitoring perizinan & sertifikasi hotel otomatis terhubung Google Ecosystem.
          </p>
        </div>

        {/* Official 3D Hotel Permit App Logo Badge */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 bg-[#0a2558] hover:scale-105 transition">
          <img src="/pwa-512x512.png" alt="Logo Perizinan Hotel" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 3. Urgent Items Card (Rekomendasi Proteksi, SLF, SLO, dll) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
        {urgentLicenses.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Semua perizinan dalam status aman / selesai diperpanjang.</span>
          </div>
        ) : (
          urgentLicenses.slice(0, 3).map((item, idx) => {
            const days = calculateRemainingDays(item.expiryDate);
            const isPast = days < 0;

            // Varied icon & background for each item matching screenshot
            const iconBg = isPast 
              ? 'bg-blue-50 text-blue-600' 
              : idx === 1 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-blue-50 text-blue-600';

            return (
              <div
                key={item.id}
                onClick={() => onSelectLicense(item)}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
              >
                {/* Left: Icon & text */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-full flex-shrink-0 ${iconBg}`}>
                    {isPast ? (
                      <Lightbulb className="w-4 h-4" />
                    ) : idx === 1 ? (
                      <FileCheck className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-blue-600 transition">
                      {item.documentName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.issuer}
                    </p>
                  </div>
                </div>

                {/* Right: Badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPast ? (
                    (() => {
                      const dur = getHumanDuration(item.expiryDate);
                      const label = Math.abs(days) >= 30 ? `Lewat ${dur.shortText}` : `Lewat ${Math.abs(days)} hr`;
                      return (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200"
                          title={`${dur.fullText} lalu`}
                        >
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>{label}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      <span>H-{days}</span>
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. KPI Grid Cards (2x2 + 1 Full Width at Bottom) */}
      <div className="grid grid-cols-2 gap-3.5">

        {/* Card 1: TOTAL IZIN */}
        <div
          onClick={() => onNavigateTab('licenses', 'ALL')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-blue-600 tracking-wider">
                TOTAL IZIN
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Tercatat di Google Sheets
            </p>
          </div>
        </div>

        {/* Card 2: KRITIS (H-60) */}
        <div
          onClick={() => onNavigateTab('licenses', 'WARNING')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-300 transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-amber-600 tracking-wider">
                KRITIS (H-60)
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.warningCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              &le; 60 hari jatuh tempo
            </p>
          </div>
        </div>

        {/* Card 3: KEDALUWARSA */}
        <div
          onClick={() => onNavigateTab('licenses', 'EXPIRED')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-rose-300 transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-rose-600 tracking-wider">
                KEDALUWARSA
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.expiredCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Sudah habis masa berlaku
            </p>
          </div>
        </div>

        {/* Card 4: AMAN (> 60 HR) */}
        <div
          onClick={() => onNavigateTab('licenses', 'SAFE')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-blue-600 tracking-wider">
                AMAN (&gt; 60 HR)
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.safeCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Berlaku jangka panjang
            </p>
          </div>
        </div>

      </div>

      {/* Card 5: Full Width Card - SELESAI */}
      <div
        onClick={() => onNavigateTab('licenses', 'COMPLETED')}
        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-emerald-700 tracking-wider">
              SELESAI
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.completedCount > 0 
                ? `${stats.completedCount} dokumen selesai diperpanjang` 
                : 'Tidak ada data dalam kategori ini'}
            </p>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
      </div>

    </div>
  );
};
