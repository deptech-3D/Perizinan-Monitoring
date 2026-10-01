import React, { useState } from 'react';
import { 
  X, 
  Link, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  Upload,
  Check,
  Zap,
  Copy,
  FolderPlus
} from 'lucide-react';
import { testGoogleAppsScriptConnection, extractSpreadsheetId, extractDriveFolderId } from '../services/googleSyncService';
import { LicenseItem } from '../types';
import { parseLicensesFromCsv } from '../utils/licenseUtils';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  driveFolderId?: string;
  onSaveUrl: (url: string) => Promise<void>;
  onSaveDriveFolder?: (folderId: string) => void;
  onManualImport: (importedLicenses: LicenseItem[]) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  driveFolderId = '',
  onSaveUrl,
  onSaveDriveFolder,
  onManualImport
}) => {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [folderInput, setFolderInput] = useState(driveFolderId);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rowCount?: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'quickImport'>('url');
  const [pasteData, setPasteData] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [sheetUrlForId, setSheetUrlForId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setTestResult({
        success: false,
        message: 'Mohon masukkan URL Google Apps Script Web App yang valid.'
      });
      setTesting(false);
      return;
    }

    const res = await testGoogleAppsScriptConnection(cleanUrl);
    setTestResult(res);
    setTesting(false);

    if (res.success) {
      await onSaveUrl(cleanUrl);
      if (onSaveDriveFolder && folderInput) {
        onSaveDriveFolder(folderInput.trim());
      }
    }
  };

  const handleQuickImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);

    try {
      let parsed: LicenseItem[] = [];
      const trimmed = pasteData.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // JSON format
        const json = JSON.parse(trimmed);
        parsed = Array.isArray(json) ? json : [json];
      } else {
        // CSV or Tab-separated text
        parsed = parseLicensesFromCsv(trimmed);
      }

      if (parsed.length === 0) {
        setImportStatus('Data tidak dapat dibaca. Pastikan format tabel atau JSON sudah benar.');
        return;
      }

      onManualImport(parsed);
      setImportStatus(`✅ Berhasil mengimpor ${parsed.length} data perizinan!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportStatus(`Gagal memproses data: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-white">
                Koneksi Google Sheets & Real-Time Sync
              </h2>
              <p className="text-xs text-blue-200">
                Penyebab data belum terupdate: sistem belum tersambung ke URL Apps Script Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Sambungkan URL Web App (Otomatis)</span>
          </button>

          <button
            onClick={() => setActiveTab('quickImport')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'quickImport'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tempel / Import Data dari Sheets (Instan)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs md:text-sm">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Mengapa Data yang Diinput Admin Belum Muncul di Sini?</span>
                </div>
                <p>
                  Aplikasi ini membutuhkan URL Deployment dari Google Apps Script Anda (berakhiran <code>/exec</code>) 
                  untuk dapat menarik data langsung dari Google Sheets. Setelah URL dihubungkan, seluruh perubahan 
                  dari komputer mana pun akan langsung tersinkronisasi secara otomatis.
                </p>
              </div>

              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    URL Web App Apps Script ATAU Link Google Spreadsheet:
                  </label>
                  <input
                    type="url"
                    required
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... atau https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bisa berupa <strong>URL Web App</strong> (akhiran <code>/exec</code>) ATAU <strong>Link Google Spreadsheet</strong> Anda langsung (pastikan akses 'Siapa saja yang memiliki link').
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <FolderPlus className="w-4 h-4 text-blue-600" />
                      <span>Folder Google Drive Penyimpanan Foto / Berkas (Ditentukan Admin):</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                      Akses Publik Otomatis
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={folderInput}
                      onChange={(e) => setFolderInput(e.target.value)}
                      placeholder="Masukkan Link Folder Google Drive atau Folder ID..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = extractDriveFolderId(folderInput);
                        setFolderInput(clean);
                        if (onSaveDriveFolder) onSaveDriveFolder(clean);
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Simpan Folder
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tempel <strong>Link Folder Google Drive</strong> atau <strong>ID Folder</strong>. Semua foto/scan yang diunggah otomatis tersimpan di folder ini dengan izin <em>"Anyone with link can view"</em> sehingga dapat langsung dibuka oleh semua user di PC maupun HP tanpa minta izin akses.
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Gagal Menghubungkan'}</p>
                      <p className="mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}

                {testResult && !testResult.success && (testResult.message.includes('GANTI_DENGAN_SPREADSHEET_ID_ANDA') || testResult.message.includes('Illegal spreadsheet id')) && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-3">
                    <div className="font-extrabold flex items-center gap-1.5 text-rose-900 text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      <span>Solusi Pasti: Ganti SPREADSHEET_ID di Google Apps Script</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      Error ini terjadi karena di dalam editor Google Apps Script (file <code>Code.gs</code>), pada baris 12 masih tertulis teks bawaan: <br/>
                      <code className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                        SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA'
                      </code>
                    </p>

                    {/* Helper Ekstrak ID Langsung */}
                    <div className="p-3.5 bg-white rounded-xl border border-rose-200 space-y-2">
                      <label className="block font-bold text-slate-800 text-[11px]">
                        Tempel Link Google Spreadsheet Anda di sini untuk mengambil ID otomatis:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sheetUrlForId}
                          onChange={(e) => setSheetUrlForId(e.target.value)}
                          placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {sheetUrlForId && (() => {
                        const extracted = extractSpreadsheetId(sheetUrlForId) || sheetUrlForId.trim();
                        return (
                          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 mt-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-blue-900 font-bold">ID Spreadsheet Anda:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(extracted);
                                  setCopiedId(true);
                                  setTimeout(() => setCopiedId(false), 2000);
                                }}
                                className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold flex items-center gap-1 cursor-pointer transition"
                              >
                                {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId ? 'ID Tersalin!' : 'Salin ID'}</span>
                              </button>
                            </div>
                            <code className="block bg-white p-1.5 rounded border border-blue-200 font-mono text-xs text-blue-800 break-all select-all font-bold">
                              {extracted}
                            </code>
                            <p className="text-[11px] text-slate-600">
                              Teks baris 12 Code.gs yang siap Anda tempel: <br/>
                              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono font-bold text-[11px]">
                                SPREADSHEET_ID: '{extracted}',
                              </code>
                            </p>
                          </div>
                        );
                      })()}

                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-700">
                        <p className="font-bold text-slate-800 text-[11px]">Langkah Cepat di Google Apps Script (1 Menit):</p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                          <li>Buka project Google Apps Script Anda di browser.</li>
                          <li>Di file <strong>Code.gs</strong>, ganti teks <code>'GANTI_DENGAN_SPREADSHEET_ID_ANDA'</code> di baris 12 dengan ID Spreadsheet Anda di atas.</li>
                          <li>Klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas &gt; pilih <strong>Manage deployments (Kelola penerapan)</strong>.</li>
                          <li>Klik ikon <strong>Pensil (Edit)</strong> &gt; pada baris Version pilih <strong>New version (Versi baru)</strong> &gt; klik <strong>Deploy</strong>.</li>
                          <li>Selesai! Kembali ke sini dan klik tombol biru <strong>"Uji Koneksi & Sinkronkan Data"</strong> di bawah.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {testResult && !testResult.success && testResult.message.includes('Failed to fetch') && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Penyebab Pasti & Cara Mengatasi "Failed to fetch":</span>
                    </div>
                    <p className="text-slate-700">
                      Server Google saat ini membalas <strong>"Perlu Izin Akses (Request Access / Login Required)"</strong>. Ini terjadi karena saat di-deploy di Apps Script, setelan <em>"Who has access"</em> masih terpilih <strong>"Only myself" (Hanya saya)</strong>.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1.5">
                      <p className="font-bold text-slate-800">Langkah Perbaikan (30 Detik di Google Apps Script):</p>
                      <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                        <li>Buka Google Apps Script project Anda.</li>
                        <li>Klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas &gt; pilih <strong>Manage deployments (Kelola penerapan)</strong>.</li>
                        <li>Klik ikon <strong>Pensil (Edit)</strong> di sebelah kanan.</li>
                        <li>Pada baris <strong>Version</strong>: pilih <strong>New version (Versi baru)</strong>.</li>
                        <li>Pada baris <strong>Who has access (Siapa yang memiliki akses)</strong>: ubah menjadi <strong>"Anyone" (Siapa saja)</strong>.</li>
                        <li>Pada baris <strong>Execute as (Jalankan sebagai)</strong>: pastikan <strong>"Me" (email Anda)</strong>.</li>
                        <li>Klik tombol <strong>Deploy (Terapkan)</strong>. Selesai! Kembali ke sini dan klik tombol biru di bawah.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menguji & Menyinkronkan...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Uji Koneksi & Sinkronkan Data</span>
                      </>
                    )}
                  </button>

                  {webAppUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput('');
                        onSaveUrl('');
                        setTestResult(null);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Putuskan Sambungan
                    </button>
                  )}
                </div>
              </form>

              {/* Step by step reminder */}
              <div className="pt-4 border-t border-slate-200">
                <p className="font-bold text-xs text-slate-800 mb-2">
                  Cara Mendapatkan URL Web App di Google Apps Script:
                </p>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1">
                  <li>Buka proyek di <strong>script.google.com</strong>.</li>
                  <li>Pastikan Anda sudah menyalin kode <code>Code.gs</code> terbaru (yang mendukung REST API).</li>
                  <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru (New deployment)</strong>.</li>
                  <li>Pilih jenis <strong>Aplikasi Web</strong>:
                    <ul className="list-disc list-inside pl-4 mt-0.5 text-slate-500">
                      <li>Jalankan sebagai: <strong>Saya (Email Anda)</strong></li>
                      <li>Akses: <strong>Siapa saja (Anyone)</strong> &larr; <em>Wajib agar data dapat diakses!</em></li>
                    </ul>
                  </li>
                  <li>Klik <strong>Terapkan (Deploy)</strong>, lalu salin <strong>URL Aplikasi Web</strong> yang berakhiran <code>/exec</code> dan tempelkan ke kolom di atas.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'quickImport' && (
            <form onSubmit={handleQuickImportSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>Cara Cepat:</strong> Anda juga bisa langsung menyalin (Copy) baris data dari Google Spreadsheet Anda dan menempelkannya (Paste) di kotak di bawah ini untuk segera memperbarui data yang baru saja diinput admin.
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tempelkan Baris dari Google Sheets atau JSON:
                </label>
                <textarea
                  rows={6}
                  required
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Contoh: Salin baris dari Google Sheets Data_Perizinan lalu Paste di sini..."
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {importStatus && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
                  {importStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Terapkan Data ke Aplikasi
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
