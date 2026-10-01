import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { LicenseItem } from '../types';
import { parseLicensesFromCsv } from '../utils/licenseUtils';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newLicenses: LicenseItem[], mode: 'merge' | 'replace') => void;
  existingCount: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCount
}) => {
  const [activeTab, setActiveTab] = useState<'appImport' | 'sheetsGuide'>('appImport');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<LicenseItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setSelectedFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('File kosong atau tidak dapat dibaca.');
        }

        const items = parseLicensesFromCsv(text);
        if (items.length === 0) {
          throw new Error('Tidak ada baris data perizinan yang valid ditemukan di file CSV tersebut.');
        }

        setParsedItems(items);
      } catch (err: any) {
        setParseError(err.message || 'Gagal memproses file CSV.');
        setParsedItems([]);
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca file dari perangkat.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleExecuteImport = () => {
    if (parsedItems.length === 0) return;
    onImport(parsedItems, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedItems([]);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <Upload className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Impor Data Perizinan CSV</h3>
              <p className="text-xs text-blue-200">Masukkan kembali file CSV yang telah Anda isi atau edit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('appImport')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appImport'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Impor Langsung ke Aplikasi SIMPERIZINAN</span>
          </button>
          <button
            onClick={() => setActiveTab('sheetsGuide')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sheetsGuide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Panduan Impor ke Google Sheets</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'appImport' ? (
            <>
              {/* Dropzone */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">
                      Klik untuk memilih file CSV atau seret ke sini
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Mendukung format file <code>.csv</code> hasil ekspor SIMPERIZINAN atau Microsoft Excel / Google Sheets
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB • {parsedItems.length} baris izin terdeteksi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                  >
                    Ganti File
                  </button>
                </div>
              )}

              {/* Error Box */}
              {parseError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Gagal membaca format CSV</p>
                    <p className="text-[11px] mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Preview Parsed Items */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">
                        {parsedItems.length} Data Izin Siap Diimpor
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Data saat ini di aplikasi: {existingCount} izin
                    </span>
                  </div>

                  {/* Mode Options */}
                  <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-700 text-[11px]">Pilih Metode Impor:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${
                          importMode === 'merge'
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <p className="font-bold text-xs">Gabungkan (Merge)</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Menambahkan data baru dan memperbarui jika ID sudah ada (Rekomendasi).
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${
                          importMode === 'replace'
                            ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-rose-600"
                        />
                        <div>
                          <p className="font-bold text-xs">Gantikan Semua (Replace)</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Menghapus seluruh {existingCount} data lama dan menggantikannya dengan isi file CSV ini.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-[11px] flex justify-between items-center">
                      <span>Pratinjau 3 Data Teratas:</span>
                      <span className="text-[10px] text-slate-300 font-normal">Total {parsedItems.length} baris</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
                      {parsedItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-[11px]">
                          <div>
                            <p className="font-bold text-slate-800">{item.documentName}</p>
                            <p className="text-slate-500 text-[10px]">
                              No: {item.licenseNumber} • Instansi: {item.issuer}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-700 font-semibold block">
                              Exp: {item.expiryDate || '-'}
                            </span>
                            <span className="text-[10px] text-blue-600 font-medium">{item.picName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Guide Tab for Google Sheets */
            <div className="space-y-3 text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950">
                <p className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Cara Memasukkan File CSV ke Google Sheets Langsung:</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Jika Anda ingin data CSV langsung masuk ke database Google Sheets yang terhubung ke Apps Script:
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                  <li>
                    <strong>Buka Spreadsheet Anda:</strong> Buka Google Sheets yang digunakan untuk SIMPERIZINAN.
                  </li>
                  <li>
                    <strong>Buka Menu Impor:</strong> Klik menu atas <strong>File</strong> &gt; pilih <strong>Impor (Import)</strong>.
                  </li>
                  <li>
                    <strong>Pilih Tab "Upload":</strong> Klik tab <em>Upload</em> lalu pilih file CSV hasil unduhan Anda.
                  </li>
                  <li>
                    <strong>Setelan Lokasi Impor:</strong>
                    <ul className="list-disc pl-5 mt-1 text-slate-600 space-y-1">
                      <li>
                        Jika sheet <code>Data_Perizinan</code> sudah ada: Pilih opsi <strong>"Ganti data pada sheet saat ini"</strong> (pastikan Anda sedang membuka tab sheet <code>Data_Perizinan</code>).
                      </li>
                      <li>
                        Tipe pemisah: Biarkan <strong>"Deteksi otomatis"</strong>.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Impor data (Import data)</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Tips:</strong> Setelah Anda mengimpor file CSV ke Google Sheets, kembali ke aplikasi SIMPERIZINAN dan klik tombol <strong>"Perbarui (Sinkron)"</strong> di atas tabel. Seluruh data dari Google Sheets akan langsung ditarik otomatis!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>

          {activeTab === 'appImport' && (
            <button
              onClick={handleExecuteImport}
              disabled={parsedItems.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Impor {parsedItems.length > 0 ? `${parsedItems.length} Data` : ''} Sekarang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
