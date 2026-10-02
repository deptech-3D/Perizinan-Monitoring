import React, { useState, useMemo, useEffect } from 'react';
import { 
  Code2, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  FolderOpen,
  HardDrive,
  Lock,
  Save
} from 'lucide-react';
import { CODE_GS_TEMPLATE, INDEX_HTML_TEMPLATE, SETUP_GUIDE_MARKDOWN } from '../data/appsScriptTemplates';
import { extractSpreadsheetId, extractDriveFolderId } from '../services/googleSyncService';
import { fetchServerConfig, saveServerConfig } from '../services/serverSyncService';

interface CodeExportViewProps {
  initialSpreadsheetUrl?: string;
  initialDriveFolderId?: string;
}

export const CodeExportView: React.FC<CodeExportViewProps> = ({
  initialSpreadsheetUrl = '',
  initialDriveFolderId = ''
}) => {
  const [subTab, setSubTab] = useState<'codegs' | 'indexhtml' | 'guide' | 'schema'>('codegs');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Persistent spreadsheet input (never resets)
  const [customSheetInput, setCustomSheetInput] = useState<string>(() => {
    return localStorage.getItem('simperizinan_export_sheet_input') || 
           localStorage.getItem('simperizinan_spreadsheet_url') || 
           initialSpreadsheetUrl || 
           '';
  });

  // Persistent google drive folder input (never resets)
  const [customDriveInput, setCustomDriveInput] = useState<string>(() => {
    return localStorage.getItem('simperizinan_export_drive_input') || 
           localStorage.getItem('simperizinan_drive_folder') || 
           initialDriveFolderId || 
           '1B53s98xT6FCFQwooHSQgX4_L3Px1qglf';
  });

  // Sync with server configuration on mount
  useEffect(() => {
    (async () => {
      const cfg = await fetchServerConfig();
      if (cfg) {
        if (cfg.spreadsheetUrl && !localStorage.getItem('simperizinan_export_sheet_input')) {
          setCustomSheetInput(cfg.spreadsheetUrl);
        }
        if (cfg.driveFolderId && !localStorage.getItem('simperizinan_export_drive_input')) {
          setCustomDriveInput(cfg.driveFolderId);
        }
      }
    })();
  }, []);

  const handleSheetInputChange = (val: string) => {
    setCustomSheetInput(val);
    localStorage.setItem('simperizinan_export_sheet_input', val);
    localStorage.setItem('simperizinan_spreadsheet_url', val);
    saveServerConfig(undefined, undefined, val);
  };

  const handleDriveInputChange = (val: string) => {
    setCustomDriveInput(val);
    localStorage.setItem('simperizinan_export_drive_input', val);
    const cleanId = extractDriveFolderId(val);
    if (cleanId) {
      localStorage.setItem('simperizinan_drive_folder', cleanId);
      saveServerConfig(undefined, cleanId);
    }
  };

  const activeSpreadsheetId = useMemo(() => {
    if (!customSheetInput.trim()) return '';
    return extractSpreadsheetId(customSheetInput) || customSheetInput.trim();
  }, [customSheetInput]);

  const activeDriveFolderId = useMemo(() => {
    if (!customDriveInput.trim()) return '';
    return extractDriveFolderId(customDriveInput) || customDriveInput.trim();
  }, [customDriveInput]);

  const activeCodeGs = useMemo(() => {
    let code = CODE_GS_TEMPLATE;
    if (activeSpreadsheetId) {
      code = code.replace(
        "SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA'",
        `SPREADSHEET_ID: '${activeSpreadsheetId}'`
      );
    }
    if (activeDriveFolderId) {
      code = code.replace(
        "DRIVE_FOLDER_ID: 'GANTI_DENGAN_FOLDER_ID_DRIVE_ANDA'",
        `DRIVE_FOLDER_ID: '${activeDriveFolderId}'`
      );
    }
    return code;
  }, [activeSpreadsheetId, activeDriveFolderId]);

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Production-Ready Source Code Hub</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Kode Sumber Google Apps Script & Panduan Instalasi
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Semua kode berikut siap pakai 100% untuk di-paste langsung ke <strong>script.google.com</strong>.
              Tidak membutuhkan hosting berbayar karena sepenuhnya ditenagai oleh infrastruktur Google Cloud gratis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition flex items-center gap-2"
            >
              <span>Buka Google Apps Script</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4 text-xs font-semibold">
          <button
            onClick={() => setSubTab('codegs')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              subTab === 'codegs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>1. Code.gs (Backend Engine)</span>
          </button>

          <button
            onClick={() => setSubTab('indexhtml')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              subTab === 'indexhtml'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>2. Index.html (Frontend UI GAS)</span>
          </button>

          <button
            onClick={() => setSubTab('guide')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              subTab === 'guide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>3. Panduan Step-by-Step Deploy</span>
          </button>

          <button
            onClick={() => setSubTab('schema')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              subTab === 'schema'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>4. Skema Kolom Google Sheets</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Code.gs */}
      {subTab === 'codegs' && (
        <div className="space-y-4">
          {/* Generator Input Spreadsheet ID & Google Drive Folder ID */}
          <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 p-5 rounded-2xl border border-blue-800/60 text-xs shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">Otomatis Masukkan ID Spreadsheet & Google Drive Anda:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3 text-emerald-400" /> Tersimpan & Tidak Ter-reset
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Tempel link Google Spreadsheet dan Google Drive Anda di bawah ini. Kode <code>Code.gs</code> di bawah akan langsung otomatis disesuaikan dan siap di-copy tanpa perlu edit manual lagi!
                </p>
              </div>

              {(activeSpreadsheetId || activeDriveFolderId) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold self-start sm:self-auto">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ID Disematkan ke Code.gs!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Kolom 1: Google Spreadsheet */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1. Link atau ID Google Spreadsheet:</span>
                  </label>
                  {activeSpreadsheetId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/60">
                      Baris 12 Code.gs
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSheetInput}
                    onChange={(e) => handleSheetInputChange(e.target.value)}
                    placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {customSheetInput && (
                    <button
                      type="button"
                      onClick={() => handleSheetInputChange('')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer"
                      title="Hapus input"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  {activeSpreadsheetId ? (
                    <span className="text-emerald-400 font-mono truncate max-w-[280px]">
                      ID: <strong>{activeSpreadsheetId}</strong>
                    </span>
                  ) : (
                    <span>ID Spreadsheet di baris 12 Code.gs</span>
                  )}
                  {customSheetInput && customSheetInput.startsWith('http') && (
                    <a
                      href={customSheetInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
                    >
                      <span>Buka Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Kolom 2: Google Drive Folder */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Link atau ID Folder Google Drive (Foto & Berkas):</span>
                  </label>
                  {activeDriveFolderId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800/60">
                      Baris 15 Code.gs
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDriveInput}
                    onChange={(e) => handleDriveInputChange(e.target.value)}
                    placeholder="Contoh: https://drive.google.com/drive/folders/1B53s98xT... ATAU Folder ID"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {customDriveInput && (
                    <button
                      type="button"
                      onClick={() => handleDriveInputChange('')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer"
                      title="Hapus input"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  {activeDriveFolderId ? (
                    <span className="text-amber-400 font-mono truncate max-w-[280px]">
                      Folder ID: <strong>{activeDriveFolderId}</strong>
                    </span>
                  ) : (
                    <span>ID Folder Drive di baris 15 Code.gs</span>
                  )}
                  {activeDriveFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${activeDriveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                    >
                      <span>Buka Folder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="ml-2 font-mono font-bold text-slate-300">Code.gs</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (doGet, checkLogin, uploadFileToDrive, saveLicenseData, sendH60EmailReminder)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeCodeGs, 'codegs')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedTab === 'codegs' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(activeCodeGs, 'Code.gs')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .gs</span>
                </button>
              </div>
            </div>

            <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto max-h-[650px] leading-relaxed selection:bg-blue-600 selection:text-white">
              <code>{activeCodeGs}</code>
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Index.html */}
      {subTab === 'indexhtml' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="ml-2 font-mono font-bold text-slate-300">Index.html</span>
              <span className="text-[10px] text-slate-500 font-mono">
                (Tailwind Responsive UI, Login, Dashboard, Upload Modal & Table)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(INDEX_HTML_TEMPLATE, 'indexhtml')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedTab === 'indexhtml' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(INDEX_HTML_TEMPLATE, 'Index.html')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh .html</span>
              </button>
            </div>
          </div>

          <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto max-h-[650px] leading-relaxed selection:bg-blue-600 selection:text-white">
            <code>{INDEX_HTML_TEMPLATE}</code>
          </pre>
        </div>
      )}

      {/* SUBTAB 3: Step-by-Step Guide */}
      {subTab === 'guide' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-8 text-slate-800">
          <div className="border-b border-slate-200 pb-5">
            <h3 className="text-xl font-black text-slate-900">
              Panduan Lengkap Implementasi & Deploy di Google Workspace
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ikuti 6 langkah di bawah ini untuk mengaktifkan sistem Anda secara penuh di Google Cloud.
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Buat File Google Spreadsheet Baru (Database)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">sheets.new</a> di browser Anda. Beri nama spreadsheet, contohnya: <code>DB_SIMPERIZINAN_MIDTOWN</code>. Salin <strong>Spreadsheet ID</strong> dari URL browser (teks panjang di antara <code>/d/</code> dan <code>/edit</code>).
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                  https://docs.google.com/spreadsheets/d/<span className="bg-amber-200 px-1 font-bold text-amber-900">1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</span>/edit
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Buat Folder Khusus di Google Drive (Penyimpanan Berkas Scan)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Google Drive</a>, buat folder baru bernama <code>BERKAS_PERIZINAN_SCAN</code>. Buka foldernya, dan salin <strong>Folder ID</strong> dari URL browser.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                  https://drive.google.com/drive/folders/<span className="bg-amber-200 px-1 font-bold text-amber-900">1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345</span>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  💡 <strong>Tips Akses Dokumen:</strong> Klik kanan folder di Drive &gt; <em>Bagikan (Share)</em> &gt; Ubah akses umum ke <em>"Siapa saja yang memiliki link dapat melihat"</em> agar dokumen scan dapat langsung dilihat oleh seluruh staff.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Buka Google Apps Script & Tempel Kode
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di Google Sheets yang baru Anda buat, klik menu atas: <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                </p>
                <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1.5 pl-1">
                  <li>Pada file default <code>Code.gs</code>, hapus semua isinya lalu paste seluruh kode dari tab <strong>Code.gs</strong> di atas.</li>
                  <li>Ubah nilai <code>SPREADSHEET_ID</code>, <code>DRIVE_FOLDER_ID</code>, dan <code>ADMIN_EMAIL</code> pada bagian <code>CONFIG</code> dengan data Anda.</li>
                  <li>Klik tombol <strong>+ (Tambah File)</strong> di panel kiri &gt; Pilih <strong>HTML</strong> &gt; Beri nama <code>Index</code>.</li>
                  <li>Paste seluruh isi tab <strong>Index.html</strong> ke file tersebut.</li>
                  <li>Tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">Ctrl + S</kbd> untuk menyimpan.</li>
                </ol>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Inisialisasi Database Otomatis (1 Kali Klik)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di toolbar Apps Script, pilih fungsi <code>setupSpreadsheet</code> pada dropdown pilihan fungsi, lalu klik tombol <strong>Jalankan (Run)</strong>.
                </p>
                <p className="text-xs text-slate-500">
                  Google akan memunculkan popup izin (*Review permissions*). Klik Akun Anda &gt; <em>Advanced</em> &gt; <em>Go to project (unsafe)</em> &gt; <em>Allow</em>. Sheet <code>Data_Perizinan</code> dan <code>Users</code> akan otomatis terbuat lengkap beserta akun default (<code>admin</code> / <code>admin123</code> dan <code>staff</code> / <code>staff123</code>).
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                5
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Pasang Pemicu Harian (Time-driven Trigger Cron H-60)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cara termudah: Di dropdown fungsi Apps Script, pilih <code>createDailyTrigger</code> dan klik <strong>Run</strong>. Script akan otomatis memasang trigger harian pukul 07:00 WIB ke fungsi <code>sendH60EmailReminder()</code>.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                6
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Deploy Aplikasi Web (Akses Multi-Komputer)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di pojok kanan atas Apps Script, klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru (New deployment)</strong>:
                </p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pl-1">
                  <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong></li>
                  <li>Jalankan sebagai: <strong>Saya (Email Anda)</strong></li>
                  <li>Siapa yang memiliki akses: <strong>Siapa saja (Anyone)</strong></li>
                </ul>
                <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 mt-2">
                  ✅ <strong>Selesai!</strong> Anda akan mendapatkan URL Web App (berakhir <code>/exec</code>). Bagikan URL tersebut ke rekan kerja Anda di Komputer 1, Komputer 2, smartphone, atau tablet. Semua dapat login, upload berkas, dan memantau izin secara real-time bersamaan!
                </p>
              </div>
            </div>

            {/* Step 7 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                7
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Hubungkan URL Web App ke SIMPERIZINAN (Agar Data Terupdate Real-Time)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Agar dashboard ini dapat membaca data yang diinput oleh Admin dari komputer lain atau dari Google Sheets secara langsung:
                </p>
                <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 pl-1">
                  <li>Salin URL Web App yang berakhiran <code>/exec</code> dari langkah 6 di atas.</li>
                  <li>Buka tab <strong>Data Perizinan</strong> &gt; Klik tombol <strong>"Hubungkan ke Google Sheets"</strong> di bar sinkronisasi bagian atas.</li>
                  <li>Tempelkan URL tersebut dan klik <strong>"Uji Koneksi & Sinkronkan Data"</strong>.</li>
                  <li>Aktifkan <strong>"Auto-Sync"</strong> agar aplikasi mengecek dan menampilkan data perizinan baru setiap 30 detik secara otomatis!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Schema */}
      {subTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Skema Kolom Sheet: <code>Data_Perizinan</code>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Struktur tabel tempat seluruh catatan perizinan disimpan di Google Sheets.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Kolom</th>
                    <th className="py-2.5 px-3">Nama Header</th>
                    <th className="py-2.5 px-3">Tipe Data</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">A</td>
                    <td className="py-2 px-3">ID_Izin</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Primary Key unik (misal LIC-2026-001)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">B</td>
                    <td className="py-2 px-3">Nama_Dokumen</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Nama dokumen izin / sertifikat</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">C</td>
                    <td className="py-2 px-3">Nomor_Perizinan</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Nomor registrasi / SK resmi</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">D</td>
                    <td className="py-2 px-3">Instansi_Penerbit</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Nama dinas / kementerian penerbit</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">E</td>
                    <td className="py-2 px-3">Tanggal_Terbit</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Date</td>
                    <td className="py-2 px-3 font-sans">Format YYYY-MM-DD</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-rose-600">F</td>
                    <td className="py-2 px-3 font-bold text-rose-600">Tanggal_Kedaluwarsa</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Date</td>
                    <td className="py-2 px-3 font-sans">Acuan utama perhitungan trigger H-60</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">G</td>
                    <td className="py-2 px-3">Sisa_Hari</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Number</td>
                    <td className="py-2 px-3 font-sans">Dihitung otomatis: Tanggal_Kedaluwarsa - Hari_Ini</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">H</td>
                    <td className="py-2 px-3">Nama_PIC</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Penanggung jawab berkas</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">I</td>
                    <td className="py-2 px-3">Email_PIC</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Email</td>
                    <td className="py-2 px-3 font-sans">Tujuan pengiriman notifikasi GmailApp</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-600">J</td>
                    <td className="py-2 px-3">URL_File_Drive</td>
                    <td className="py-2 px-3 font-sans text-slate-500">URL</td>
                    <td className="py-2 px-3 font-sans">Link Google Drive hasil upload berkas scan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">K</td>
                    <td className="py-2 px-3">Status_Perpanjangan</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Belum Diproses / Dalam Proses / Selesai</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">L</td>
                    <td className="py-2 px-3">Catatan</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Text</td>
                    <td className="py-2 px-3 font-sans">Keterangan proses pengurusan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">M</td>
                    <td className="py-2 px-3">Terakhir_Notif_Sent</td>
                    <td className="py-2 px-3 font-sans text-slate-500">Datetime</td>
                    <td className="py-2 px-3 font-sans">Tanggal & jam email H-60 terakhir dikirim</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Skema Kolom Sheet: <code>Users</code>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Data otentikasi login multi-komputer berbasis Google Sheets.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Kolom</th>
                    <th className="py-2.5 px-3">Nama Header</th>
                    <th className="py-2.5 px-3">Contoh Nilai</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">A</td>
                    <td className="py-2 px-3">ID_User</td>
                    <td className="py-2 px-3">USR-001</td>
                    <td className="py-2 px-3 font-sans">ID Pengguna</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">B</td>
                    <td className="py-2 px-3">Username</td>
                    <td className="py-2 px-3">admin</td>
                    <td className="py-2 px-3 font-sans">Username untuk masuk ke Web App</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">C</td>
                    <td className="py-2 px-3">Password</td>
                    <td className="py-2 px-3">admin123</td>
                    <td className="py-2 px-3 font-sans">Kata sandi akun</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">D</td>
                    <td className="py-2 px-3">Nama_Lengkap</td>
                    <td className="py-2 px-3">Admin Engineering</td>
                    <td className="py-2 px-3 font-sans">Nama display pengguna</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">E</td>
                    <td className="py-2 px-3">Email</td>
                    <td className="py-2 px-3">admengmidtownhotelsmd@gmail.com</td>
                    <td className="py-2 px-3 font-sans">Email notifikasi akun</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">F</td>
                    <td className="py-2 px-3">Role</td>
                    <td className="py-2 px-3 font-bold text-blue-700">Admin / Staff</td>
                    <td className="py-2 px-3 font-sans">Hak akses: Admin atau Staff (Penginput)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">G</td>
                    <td className="py-2 px-3">Status_Aktif</td>
                    <td className="py-2 px-3">Aktif</td>
                    <td className="py-2 px-3 font-sans">Aktif atau Nonaktif</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-blue-600">H</td>
                    <td className="py-2 px-3">Terakhir_Login</td>
                    <td className="py-2 px-3">2026-09-29 19:40</td>
                    <td className="py-2 px-3 font-sans">Waktu login terakhir</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
