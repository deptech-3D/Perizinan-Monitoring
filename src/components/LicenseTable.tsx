import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Mail, 
  FileCheck, 
  ArrowUpDown,
  FileQuestion,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Minimize2,
  Maximize2,
  Info,
  Upload,
  Building2
} from 'lucide-react';
import { LicenseItem, UserAccount } from '../types';
import { 
  calculateRemainingDays, 
  getExpiryStatus, 
  formatDateIndo, 
  exportLicensesToCsv 
} from '../utils/licenseUtils';
import { CsvImportModal } from './CsvImportModal';

interface LicenseTableProps {
  licenses: LicenseItem[];
  currentUser: UserAccount;
  onAddLicense: () => void;
  onEditLicense: (license: LicenseItem) => void;
  onDeleteLicense: (license: LicenseItem) => void;
  onSendManualReminder: (license: LicenseItem) => void;
  onRefreshData?: () => void;
  onImportCsv?: (licenses: LicenseItem[], mode: 'merge' | 'replace') => void;
  isSyncing?: boolean;
  defaultFilter?: string;
}

export const LicenseTable: React.FC<LicenseTableProps> = ({
  licenses,
  currentUser,
  onAddLicense,
  onEditLicense,
  onDeleteLicense,
  onSendManualReminder,
  onRefreshData,
  onImportCsv,
  isSyncing = false,
  defaultFilter = 'ALL'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>(defaultFilter);
  const [sortField, setSortField] = useState<'expiryDate' | 'documentName' | 'remainingDays' | 'status'>('remainingDays');
  const [sortAsc, setSortAsc] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (expandedRowIds.size === filteredLicenses.length) {
      setExpandedRowIds(new Set());
    } else {
      setExpandedRowIds(new Set(filteredLicenses.map(l => l.id)));
    }
  };

  React.useEffect(() => {
    if (defaultFilter) {
      setSelectedFilter(defaultFilter);
    }
  }, [defaultFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
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

  // Urgent list for banner
  const urgentLicenses = useMemo(() => {
    return licenses
      .filter((item) => {
        if (item.status === 'Selesai') return false;
        const days = calculateRemainingDays(item.expiryDate);
        return days <= 60;
      })
      .sort((a, b) => calculateRemainingDays(a.expiryDate) - calculateRemainingDays(b.expiryDate));
  }, [licenses]);

  // Filtered and sorted licenses
  const filteredLicenses = useMemo(() => {
    return licenses
      .filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          (item.documentName || '').toLowerCase().includes(query) ||
          (item.licenseNumber || '').toLowerCase().includes(query) ||
          (item.issuer || '').toLowerCase().includes(query) ||
          (item.picName || '').toLowerCase().includes(query) ||
          (item.picEmail || '').toLowerCase().includes(query);

        if (!matchesQuery) return false;

        const days = calculateRemainingDays(item.expiryDate);

        if (selectedFilter === 'WARNING') {
          return days >= 0 && days <= 60 && item.status !== 'Selesai';
        }
        if (selectedFilter === 'EXPIRED') {
          return days < 0 && item.status !== 'Selesai';
        }
        if (selectedFilter === 'SAFE') {
          return days > 60 && item.status !== 'Selesai';
        }
        if (selectedFilter === 'COMPLETED') {
          return item.status === 'Selesai';
        }
        if (selectedFilter === 'PROGRESS') {
          return item.status === 'Dalam Proses';
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'remainingDays') {
          const daysA = calculateRemainingDays(a.expiryDate);
          const daysB = calculateRemainingDays(b.expiryDate);
          diff = daysA - daysB;
        } else if (sortField === 'expiryDate') {
          diff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else if (sortField === 'status') {
          diff = (a.status || '').localeCompare(b.status || '');
        } else {
          diff = (a.documentName || '').localeCompare(b.documentName || '');
        }
        return sortAsc ? diff : -diff;
      });
  }, [licenses, searchQuery, selectedFilter, sortField, sortAsc]);

  const toggleSort = (field: 'expiryDate' | 'documentName' | 'remainingDays' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Urgent Warning Banner */}
      {stats.urgentTotal > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/30 flex-shrink-0 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Peringatan Kritis: {stats.urgentTotal} Dokumen Perizinan Membutuhkan Tindakan Segera!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
                    Notifikasi H-60 Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Terdapat <strong className="text-amber-700">{stats.warningCount} izin</strong> mendekati jatuh tempo (sisa &le; 60 hari) dan{' '}
                  <strong className="text-rose-700">{stats.expiredCount} izin</strong> sudah melewati batas kedaluwarsa.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedFilter('WARNING')}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-300 rounded-lg transition border border-amber-300"
              >
                Tampilkan Izin H-60
              </button>
              {stats.expiredCount > 0 && (
                <button
                  onClick={() => setSelectedFilter('EXPIRED')}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-rose-900 bg-rose-200/70 hover:bg-rose-300 rounded-lg transition border border-rose-300"
                >
                  Lihat Kedaluwarsa
                </button>
              )}
            </div>
          </div>

          {/* Quick list of urgent items */}
          <div className="mt-4 pt-3 border-t border-amber-300/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentLicenses.slice(0, 3).map((item) => {
              const days = calculateRemainingDays(item.expiryDate);
              const isPast = days < 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onEditLicense(item)}
                  className="bg-white/80 hover:bg-white p-2.5 rounded-lg border border-amber-300/60 shadow-xs cursor-pointer transition flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.documentName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.issuer}</p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                      isPast
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isPast ? `${Math.abs(days)} hr lalu` : `H-${days}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div 
          onClick={() => setSelectedFilter('ALL')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedFilter === 'ALL'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Izin</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tercatat di Google Sheets</p>
        </div>

        {/* Peringatan H-60 */}
        <div 
          onClick={() => setSelectedFilter('WARNING')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedFilter === 'WARNING'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Kritis (H-60)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.warningCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">&le; 60 hari jatuh tempo</p>
        </div>

        {/* Kedaluwarsa */}
        <div 
          onClick={() => setSelectedFilter('EXPIRED')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedFilter === 'EXPIRED'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Kedaluwarsa
            </span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{stats.expiredCount}</p>
          <p className="text-[11px] text-rose-700/80 mt-0.5">Sudah habis masa berlaku</p>
        </div>

        {/* Masih Aman */}
        <div 
          onClick={() => setSelectedFilter('SAFE')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            selectedFilter === 'SAFE'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Aman (&gt; 60 Hr)</span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{stats.safeCount}</p>
          <p className="text-[11px] text-blue-700/80 mt-0.5">Berlaku jangka panjang</p>
        </div>

        {/* Selesai */}
        <div 
          onClick={() => setSelectedFilter('COMPLETED')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs col-span-2 lg:col-span-1 ${
            selectedFilter === 'COMPLETED'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Selesai</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.completedCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Selesai diperpanjang</p>
        </div>
      </div>

      {/* Control bar: Search, Filter, Export, Add */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama izin, nomor SK, instansi, atau PIC..."
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="ALL">Semua Kategori ({stats.total})</option>
              <option value="WARNING">Peringatan H-60 ({stats.warningCount})</option>
              <option value="EXPIRED">Kedaluwarsa ({stats.expiredCount})</option>
              <option value="PROGRESS">Dalam Proses</option>
              <option value="SAFE">Aman &gt; 60 Hari ({stats.safeCount})</option>
              <option value="COMPLETED">Selesai ({stats.completedCount})</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 justify-end flex-wrap">
          {/* Toggle Buka/Tutup Semua Rincian */}
          <button
            onClick={toggleAllRows}
            title={expandedRowIds.size === filteredLicenses.length ? "Tutup semua rincian dokumen" : "Buka semua rincian dokumen"}
            className="px-3 py-2 text-xs font-semibold rounded-lg transition border flex items-center gap-1.5 cursor-pointer bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
          >
            {expandedRowIds.size === filteredLicenses.length ? <Minimize2 className="w-3.5 h-3.5 text-slate-600" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-600" />}
            <span>{expandedRowIds.size === filteredLicenses.length ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}</span>
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              title="Perbarui data terbaru dari database"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Perbarui'}</span>
            </button>
          )}

          <button
            onClick={() => exportLicensesToCsv(filteredLicenses)}
            title="Download Spreadsheet CSV"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          {onImportCsv && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              title="Unggah dan impor file CSV hasil unduhan / editan"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Impor CSV</span>
            </button>
          )}

          <button
            onClick={onAddLicense}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Izin Baru</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Info:</strong> Kolom <strong>Instansi Penerbit</strong>, <strong>Penanggung Jawab (PIC)</strong>, dan <strong>Berkas Google Drive</strong> ditampilkan lengkap saat Anda <strong>mengklik baris perizinan</strong>.
          </span>
        </div>
        <button 
          type="button"
          onClick={toggleAllRows}
          className="text-[11px] text-blue-700 hover:text-blue-900 font-bold underline flex-shrink-0 cursor-pointer"
        >
          {expandedRowIds.size === filteredLicenses.length ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-xs tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-3 w-12 text-center text-slate-400">#</th>
                <th 
                  onClick={() => toggleSort('documentName')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-300 select-none min-w-[260px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Dokumen & Nomor SK</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('expiryDate')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-300 select-none min-w-[150px] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Masa Berlaku</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('remainingDays')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-300 select-none min-w-[160px] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sisa Waktu (Status)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-300 select-none min-w-[170px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Proses</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right min-w-[120px] whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileQuestion className="w-10 h-10 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada data perizinan ditemukan</p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ubah filter status di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((item, index) => {
                  const statusInfo = getExpiryStatus(item);
                  const days = calculateRemainingDays(item.expiryDate);
                  const isExpanded = expandedRowIds.has(item.id);

                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition ${
                          days < 0 && item.status !== 'Selesai' ? 'bg-rose-50/30' : ''
                        } ${isExpanded ? 'bg-blue-50/30 ring-1 ring-blue-300/50' : ''}`}
                      >
                        {/* Kolom Nomor & Expand Icon */}
                        <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-xs align-top">
                          <button
                            type="button"
                            onClick={() => toggleRow(item.id)}
                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-blue-600 transition inline-flex items-center justify-center gap-1 group cursor-pointer"
                            title={isExpanded ? "Tutup rincian perizinan" : "Klik untuk tampilkan rincian instansi & PIC"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                            )}
                            <span className="font-mono text-xs">{index + 1}</span>
                          </button>
                        </td>

                        {/* Dokumen & Nomor SK (Bisa dibaca FULL, sambung ke bawah tanpa terpotong) */}
                        <td className="py-3.5 px-4 align-top">
                          <div 
                            onClick={() => toggleRow(item.id)}
                            className="cursor-pointer group select-text"
                            title="Klik untuk membuka/menutup rincian instansi & PIC"
                          >
                            <div className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition break-words whitespace-normal text-xs md:text-sm">
                              {item.documentName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <code 
                                className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-800 group-hover:border-blue-200 transition break-words whitespace-normal"
                              >
                                {item.licenseNumber}
                              </code>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tanggal Terbit & Expire (Masa Berlaku) */}
                        <td 
                          onClick={() => toggleRow(item.id)}
                          className="py-3.5 px-4 whitespace-nowrap align-top cursor-pointer"
                          title="Klik untuk membuka/menutup rincian"
                        >
                          <div className="text-xs">
                            <span className="text-slate-400 text-[11px]">Exp:</span>{' '}
                            <strong className="text-slate-900">{formatDateIndo(item.expiryDate)}</strong>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Terbit: {formatDateIndo(item.issueDate)}
                          </div>
                        </td>

                        {/* Sisa Waktu & Badge (Sisa Waktu Status) */}
                        <td 
                          onClick={() => toggleRow(item.id)}
                          className="py-3.5 px-4 whitespace-nowrap align-top cursor-pointer"
                          title="Klik untuk membuka/menutup rincian"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} flex-shrink-0`}></span>
                            <span 
                              className={`px-2.5 py-1 text-xs rounded-full border ${statusInfo.badgeClass}`}
                              title={statusInfo.duration ? statusInfo.duration.fullText : ''}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          {item.lastNotifSent && item.lastNotifSent !== '-' && (
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>Notif: {item.lastNotifSent}</span>
                            </div>
                          )}
                        </td>

                        {/* Status Proses (Pindah ke kolom setelah Sisa Waktu) */}
                        <td 
                          onClick={() => toggleRow(item.id)}
                          className="py-3.5 px-4 align-top cursor-pointer group"
                          title="Klik untuk membuka/menutup rincian instansi & PIC"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border transition ${
                                item.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : item.status === 'Dalam Proses'
                                  ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.status || 'Belum Diproses'}
                            </span>
                            {item.notes && (
                              <p className="text-[11px] text-slate-500 leading-tight mt-0.5 break-words whitespace-normal max-w-[220px]" title={item.notes}>
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                          <div className="flex items-center justify-end gap-1">
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka Berkas Google Drive"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => onSendManualReminder(item)}
                              title="Kirim Notifikasi Pengingat Manual via Email"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditLicense(item)}
                              title="Edit Data Perizinan"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {currentUser.role === 'Admin' ? (
                              <button
                                onClick={() => onDeleteLicense(item)}
                                title="Hapus Data (Khusus Admin)"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span 
                                title="Hanya Admin yang dapat menghapus data" 
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Baris Rincian Lengkap Saat Diklik (Accordion Drawer) */}
                      {isExpanded && (
                        <tr className="bg-blue-50/50 border-b border-blue-200">
                          <td colSpan={6} className="p-3.5 sm:p-5">
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2.5 py-1 rounded">
                                    Rincian Lengkap Dokumen
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-500">{item.id}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRow(item.id)}
                                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                                >
                                  <span>Tutup Rincian</span>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                                {/* Instansi Penerbit - Ditampilkan Lengkap Saat Diklik */}
                                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 col-span-1 sm:col-span-2 lg:col-span-1">
                                  <span className="text-blue-700 block text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Instansi Penerbit:</span>
                                  </span>
                                  <p className="font-bold text-slate-900 mt-1 text-sm">{item.issuer || '-'}</p>
                                </div>

                                {/* Penanggung Jawab (PIC) */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[11px] font-medium">Penanggung Jawab (PIC):</span>
                                  <p className="font-bold text-slate-900 mt-1 text-sm">{item.picName || '-'}</p>
                                  {item.picEmail && (
                                    <a href={`mailto:${item.picEmail}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1">
                                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                                      <span>{item.picEmail}</span>
                                    </a>
                                  )}
                                </div>

                                {/* Berkas Google Drive */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[11px] font-medium">Berkas Dokumen:</span>
                                  {item.fileUrl ? (
                                    <div className="mt-1.5">
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition border border-blue-300"
                                      >
                                        <FolderOpen className="w-4 h-4 text-blue-600" />
                                        <span>Buka di Google Drive</span>
                                        <ExternalLink className="w-3 h-3 text-blue-500" />
                                      </a>
                                      {item.fileName && (
                                        <span className="text-[11px] text-slate-500 block mt-1 truncate" title={item.fileName}>
                                          {item.fileName} ({item.fileSize || '-'})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-slate-400 italic mt-1 text-xs">Belum ada berkas terlampir</p>
                                  )}
                                </div>

                                {/* Masa Berlaku */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[11px] font-medium">Masa Berlaku:</span>
                                  <p className="font-semibold text-slate-900 mt-1">
                                    Terbit: {formatDateIndo(item.issueDate)} <br/>
                                    Exp: <strong className="text-rose-600">{formatDateIndo(item.expiryDate)}</strong>
                                  </p>
                                </div>

                                {/* Status Proses & Catatan */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-1 sm:col-span-2">
                                  <span className="text-slate-500 block text-[11px] font-medium">Status Proses & Catatan:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${
                                        item.status === 'Selesai'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : item.status === 'Dalam Proses'
                                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'
                                          : 'bg-slate-200 text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {item.status || 'Belum Diproses'}
                                    </span>
                                  </div>
                                  {item.notes ? (
                                    <p className="text-slate-700 mt-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs break-words whitespace-normal">
                                      {item.notes}
                                    </p>
                                  ) : (
                                    <p className="text-slate-400 italic text-xs mt-1">Tidak ada catatan tambahan.</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                                {item.fileUrl && (
                                  <a
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Buka File Google Drive</span>
                                    <ExternalLink className="w-3 h-3 text-blue-500" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSendManualReminder(item)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Kirim Notifikasi Email</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditLicense(item)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Edit Data</span>
                                </button>
                                {currentUser.role === 'Admin' && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteLicense(item)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus Izin</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onImportCsv && (
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportCsv}
          existingCount={licenses.length}
        />
      )}
    </div>
  );
};
