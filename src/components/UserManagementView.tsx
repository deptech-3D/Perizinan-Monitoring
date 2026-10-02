import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Trash2, 
  Edit, 
  Key, 
  CheckCircle, 
  XCircle, 
  Lock,
  Mail,
  Shield,
  Clock,
  Eye,
  EyeOff,
  Link2,
  FolderOpen,
  RefreshCw,
  Save,
  ExternalLink,
  CheckCircle2,
  Check,
  HardDrive,
  FileSpreadsheet,
  Cloud,
  Sparkles,
  Info,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { extractDriveFolderId, testGoogleAppsScriptConnection } from '../services/googleSyncService';

interface UserManagementViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
  // Google Cloud Integration & Sync Props
  webAppUrl?: string;
  spreadsheetUrl?: string;
  driveFolderId?: string;
  onSaveConfig?: (webAppUrl: string, driveFolderId: string, spreadsheetUrl?: string) => Promise<boolean>;
  onSyncAll?: () => Promise<void>;
  onSyncLicenses?: () => Promise<void>;
  onSyncUsers?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  licenseCount?: number;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  webAppUrl = '',
  spreadsheetUrl = '',
  driveFolderId = '',
  onSaveConfig,
  onSyncAll,
  onSyncLicenses,
  onSyncUsers,
  isSyncing = false,
  lastSyncedAt = null,
  licenseCount = 0
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [active, setActive] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Integration fields state
  const [inputUrl, setInputUrl] = useState(webAppUrl || spreadsheetUrl || '');
  const [inputFolder, setInputFolder] = useState(driveFolderId || '');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; errorType?: string; rowCount?: number } | null>(null);

  useEffect(() => {
    if (webAppUrl || spreadsheetUrl) {
      setInputUrl(webAppUrl || spreadsheetUrl || '');
    }
  }, [webAppUrl, spreadsheetUrl]);

  useEffect(() => {
    if (driveFolderId) {
      setInputFolder(driveFolderId);
    }
  }, [driveFolderId]);

  const cleanFolderId = extractDriveFolderId(inputFolder);
  const isSpreadsheetLink = inputUrl.includes('docs.google.com/spreadsheets');
  const isAppsScriptUrl = inputUrl.includes('script.google.com/macros/s');

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) return;
    setIsTestingConn(true);
    setTestResult(null);
    const res = await testGoogleAppsScriptConnection(inputUrl.trim());
    setTestResult(res);
    setIsTestingConn(false);
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveConfig) return;

    setIsSavingConfig(true);
    let targetWebAppUrl = inputUrl.trim();
    let targetSpreadsheetUrl = '';

    if (isSpreadsheetLink) {
      targetSpreadsheetUrl = inputUrl.trim();
      targetWebAppUrl = inputUrl.trim();
    } else {
      targetWebAppUrl = inputUrl.trim();
      targetSpreadsheetUrl = spreadsheetUrl;
    }

    const success = await onSaveConfig(targetWebAppUrl, cleanFolderId, targetSpreadsheetUrl);
    setIsSavingConfig(false);
    if (success) {
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 4000);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setShowModalPassword(false);
    setRole('Staff');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword(user.password || '');
    setShowModalPassword(false);
    setRole(user.role);
    setActive(user.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      onUpdateUser(editingUserId, {
        username,
        fullName,
        email,
        password: password || undefined,
        role,
        active
      });
    } else {
      onAddUser({
        username,
        fullName,
        email,
        password: password || '123456',
        role,
        active
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Manajemen Pengguna & Hak Akses (Role RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Seluruh data akun tersinkronisasi langsung dengan sheet <code>Users</code> di Google Spreadsheet. 
            Hanya role <strong>Admin</strong> yang memiliki otoritas untuk menambah, mengubah, atau menghapus hak akses.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Matrix Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Hak Akses Role: ADMIN</span>
          </div>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Melihat seluruh data perizinan, statistik & dashboard.</li>
            <li>Menambah, mengedit, dan <strong>menghapus data perizinan</strong>.</li>
            <li><strong>Mengelola akun user</strong> (tambah, edit role, nonaktifkan, hapus).</li>
            <li>Mengunduh laporan spreadsheet CSV/Excel.</li>
            <li>Memicu pengujian simulasi notifikasi H-60.</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2">
            <User className="w-4 h-4 text-slate-600" />
            <span>Hak Akses Role: PENGINPUT (STAFF)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            <li>Melihat daftar perizinan & status masa berlaku H-60.</li>
            <li>Menginput dan mengedit data perizinan baru.</li>
            <li>Mengunggah berkas scan (PDF/Foto) ke folder Google Drive.</li>
            <li><strong>Tidak dapat</strong> mengelola user lain atau menghapus perizinan sensitif.</li>
          </ul>
        </div>
      </div>

      {/* Google Cloud Integration & Persistent Sync Panel (Permintaan Admin) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Pengaturan Sinkronisasi Google Spreadsheet & Google Drive</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      Permanen di Server
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Konfigurasi tersimpan otomatis dan <strong>tidak akan terhapus</strong> jika sudah diisi Admin. Digunakan untuk sinkronisasi data perizinan dan sheet Users antar perangkat (PC & HP).
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Status Stats */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
                <span className="text-slate-400">Total Akun:</span>{' '}
                <strong className="text-white font-mono">{users.length} User</strong>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
                <span className="text-slate-400">Total Izin:</span>{' '}
                <strong className="text-white font-mono">{licenseCount} Dokumen</strong>
              </div>
              {lastSyncedAt && (
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-400">Sinkron Terakhir:</span>{' '}
                  <strong className="text-emerald-300 font-mono">{lastSyncedAt}</strong>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveIntegration} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Kolom 1: URL Web App Apps Script ATAU Link Google Spreadsheet */}
              <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>1. URL Web App Apps Script ATAU Link Google Spreadsheet:</span>
                  </label>
                  {isSpreadsheetLink && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      Link Spreadsheet
                    </span>
                  )}
                  {isAppsScriptUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                      Web App Exec
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec ATAU https://docs.google.com/spreadsheets/d/..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-9"
                  />
                  <Link2 className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Mendukung Web App Script (`/exec`) atau Link Berbagi Google Spreadsheet.</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingConn || !inputUrl.trim()}
                      className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Menguji...' : 'Uji Koneksi'}</span>
                    </button>
                    {inputUrl && inputUrl.startsWith('http') && (
                      <a
                        href={inputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition"
                      >
                        <span>Buka Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Diagnostic Result Banner */}
                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs mt-2 ${
                    testResult.success
                      ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                      : testResult.errorType === 'SPREADSHEET_RESTRICTED'
                      ? 'bg-amber-950/90 border-amber-600 text-amber-200'
                      : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="font-bold">
                          {testResult.success ? 'Koneksi Berhasil!' : 'Perhatian Konfigurasi:'}
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {testResult.message}
                        </p>
                        {testResult.errorType === 'SPREADSHEET_RESTRICTED' && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <a
                              href={inputUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow"
                            >
                              <span>1. Buka Spreadsheet & Ubah Akses "Bagikan"</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kolom 2: Link Folder Google Drive Penyimpanan Foto / Berkas (Ditentukan Admin) */}
              <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <span>2. Link Folder Google Drive Penyimpanan Foto / Berkas (Ditentukan Admin):</span>
                  </label>
                  {cleanFolderId && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50 font-mono">
                      ID: {cleanFolderId.slice(0, 10)}...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={inputFolder}
                    onChange={(e) => setInputFolder(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1B53s98xT... ATAU Folder ID"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono pr-9"
                  />
                  <HardDrive className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Folder tujuan saat Staff mengunggah foto perizinan atau berkas scan PDF.</span>
                  {cleanFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${cleanFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                    >
                      <span>Buka Folder Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Simpan Konfigurasi & Tombol Aksi Sinkronisasi Data & User */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto disabled:opacity-50"
                >
                  {isSavingConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : configSaveSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSavingConfig
                      ? 'Menyimpan...'
                      : configSaveSuccess
                      ? 'Tersimpan Permanen!'
                      : 'Simpan Konfigurasi Admin'}
                  </span>
                </button>

                {configSaveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Tersimpan di server!
                  </span>
                )}
              </div>

              {/* Action Buttons for Data and User Sync */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                {onSyncAll && (
                  <button
                    type="button"
                    onClick={onSyncAll}
                    disabled={isSyncing || (!inputUrl && !webAppUrl)}
                    title="Sinkronkan seluruh data perizinan dan daftar akun pengguna sekaligus"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : '🔄 Sinkronkan Data & User'}</span>
                  </button>
                )}

                {onSyncLicenses && (
                  <button
                    type="button"
                    onClick={onSyncLicenses}
                    disabled={isSyncing || (!inputUrl && !webAppUrl)}
                    title="Sinkronkan data perizinan dengan Google Sheets"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Data Izin</span>
                  </button>
                )}

                {onSyncUsers && (
                  <button
                    type="button"
                    onClick={onSyncUsers}
                    disabled={isSyncing || (!inputUrl && !webAppUrl)}
                    title="Sinkronkan sheet Users dengan Google Sheets"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Akun User</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Daftar Akun Terdaftar ({users.length})</h3>
          <span className="text-xs text-slate-400">Sheet: Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-6">Pengguna</th>
                <th className="py-3 px-6">Username</th>
                <th className="py-3 px-6">Email Terdaftar</th>
                <th className="py-3 px-6">Password</th>
                <th className="py-3 px-6">Peran (Role)</th>
                <th className="py-3 px-6">Status Akun</th>
                <th className="py-3 px-6">Terakhir Login</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{u.fullName}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs text-slate-700">
                      {u.username}
                    </td>

                    <td className="py-3.5 px-6 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>
                          {revealedIds.has(u.id) ? u.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal(u.id)}
                          className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title={revealedIds.has(u.id) ? "Sembunyikan password" : "Lihat password"}
                        >
                          {revealedIds.has(u.id) ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'Admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-medium text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-slate-500 text-xs">
                      {u.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{u.lastLogin}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus pengguna "${u.username}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Jabatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mis: Hendra Wijaya (Chief Engineer)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username (Untuk Login)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mis: chief.hendra"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Notifikasi
                </label>
                <input
                  type="email"
                  required
                  placeholder="admengmidtownhotelsmd@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    required={!editingUserId}
                    placeholder={editingUserId ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran (Role Akses)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Staff">Staff (Penginput)</option>
                    <option value="Admin">Admin (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={active ? '1' : '0'}
                    onChange={(e) => setActive(e.target.value === '1')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
