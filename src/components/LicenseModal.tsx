import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertCircle, 
  FolderPlus, 
  ExternalLink,
  Trash2,
  Image as ImageIcon,
  Loader2,
  FolderCheck,
  Globe,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { LicenseItem, LicenseStatus } from '../types';
import { uploadFileToGoogleDrive, extractDriveFolderId } from '../services/googleSyncService';
import { uploadFileToServer } from '../services/serverSyncService';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (licenseData: Partial<LicenseItem>, fileData?: { name: string; size: string; base64: string }) => void;
  editLicense?: LicenseItem | null;
  webAppUrl?: string;
  driveFolderId?: string;
  onSaveDriveFolderId?: (folderId: string) => void;
  isAdmin?: boolean;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editLicense,
  webAppUrl = '',
  driveFolderId = '',
  onSaveDriveFolderId,
  isAdmin = true
}) => {
  const [documentName, setDocumentName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [picName, setPicName] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [status, setStatus] = useState<LicenseStatus>('Belum Diproses');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [customFolderId, setCustomFolderId] = useState(driveFolderId);
  const [showFolderSettings, setShowFolderSettings] = useState(false);

  useEffect(() => {
    if (editLicense) {
      setDocumentName(editLicense.documentName || '');
      setLicenseNumber(editLicense.licenseNumber || '');
      setIssuer(editLicense.issuer || '');
      setIssueDate(editLicense.issueDate || '');
      setExpiryDate(editLicense.expiryDate || '');
      setPicName(editLicense.picName || '');
      setPicEmail(editLicense.picEmail || '');
      setStatus(editLicense.status || 'Belum Diproses');
      setNotes(editLicense.notes || '');
      setFileUrl(editLicense.fileUrl || '');
      setFileName(editLicense.fileName || '');
      setSelectedFile(null);
      setFileBase64('');
      setImagePreview(null);
    } else {
      setDocumentName('');
      setLicenseNumber('');
      setIssuer('');
      setIssueDate(new Date().toISOString().slice(0, 10));
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(nextYear.toISOString().slice(0, 10));
      setPicName('');
      setPicEmail('');
      setStatus('Belum Diproses');
      setNotes('');
      setFileUrl('');
      setFileName('');
      setSelectedFile(null);
      setFileBase64('');
      setImagePreview(null);
    }
    setCustomFolderId(driveFolderId);
    setShowFolderSettings(false);
  }, [editLicense, isOpen, driveFolderId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const isImg = file.type.startsWith('image/');
      if (isImg) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileBase64(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadStatusText('Menyiapkan data perizinan...');

    let finalFileUrl = fileUrl;
    let finalFileName = selectedFile ? selectedFile.name : fileName;

    // Save customized folder if admin changed it
    const activeFolder = customFolderId ? extractDriveFolderId(customFolderId) : driveFolderId;
    if (isAdmin && customFolderId && onSaveDriveFolderId && customFolderId !== driveFolderId) {
      onSaveDriveFolderId(activeFolder);
    }

    // Direct Google Drive Upload with Public Link
    if (selectedFile && fileBase64) {
      setUploadStatusText('Mengunggah foto ke Google Drive (akses publik untuk semua)...');

      if (webAppUrl && webAppUrl.startsWith('http')) {
        try {
          const driveRes = await uploadFileToGoogleDrive(
            webAppUrl,
            fileBase64,
            selectedFile.name,
            selectedFile.type,
            activeFolder
          );
          if (driveRes.success && driveRes.fileUrl) {
            finalFileUrl = driveRes.fileUrl;
            finalFileName = driveRes.fileName || selectedFile.name;
          }
        } catch (err) {
          console.warn('Drive upload error, using server fallback:', err);
        }
      }

      // If Google Drive link wasn't generated, fallback to local cloud storage server so all HP & PC users can still view it
      if (!finalFileUrl || finalFileUrl.includes('mock-')) {
        setUploadStatusText('Menyimpan foto ke server cloud aplikasi...');
        try {
          const srvRes = await uploadFileToServer(selectedFile.name, fileBase64);
          if (srvRes?.fileUrl) {
            finalFileUrl = srvRes.fileUrl;
            finalFileName = srvRes.fileName;
          }
        } catch {
          // ignore
        }
      }
    }

    const payload: Partial<LicenseItem> = {
      id: editLicense ? editLicense.id : undefined,
      documentName,
      licenseNumber,
      issuer,
      issueDate,
      expiryDate,
      picName,
      picEmail,
      status,
      notes,
      fileUrl: finalFileUrl,
      fileName: finalFileName
    };

    const filePayload = selectedFile
      ? {
          name: finalFileName,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          base64: fileBase64
        }
      : undefined;

    onSave(payload, filePayload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">
                {editLicense ? 'Edit Data Perizinan' : 'Input Data Perizinan Baru'}
              </h2>
              <p className="text-xs text-blue-200">
                Foto otomatis tersimpan di Google Drive & dapat diakses publik oleh semua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm">
          {/* Row 1: Nama Dokumen */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Dokumen / Jenis Izin <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Contoh: Sertifikat Laik Fungsi (SLF) Bangunan Gedung"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Row 2: Nomor & Instansi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Perizinan / SK <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Contoh: 503/SLF-BG/DPMPTSP/2024"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instansi Penerbit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Contoh: DPMPTSP & Dinas PUPR Kota"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Tanggal Terbit & Kedaluwarsa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Kedaluwarsa <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold text-rose-950"
              />
            </div>
          </div>

          {/* Row 4: PIC & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: Hendra Wijaya (Chief Engineer)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email PIC (Penerima Notifikasi)
              </label>
              <input
                type="email"
                value={picEmail}
                onChange={(e) => setPicEmail(e.target.value)}
                placeholder="chief.eng@midtownhotel.co.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Status Perpanjangan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LicenseStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="Belum Diproses">Belum Diproses (Perlu Pengurusan)</option>
              <option value="Dalam Proses">Dalam Proses (Sedang Ditangani / Pengajuan)</option>
              <option value="Selesai">Selesai (Dokumen Baru Sudah Terbit - Matikan Notifikasi)</option>
            </select>
          </div>

          {/* Row 6: Upload Foto / Berkas Langsung ke Google Drive */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block text-xs">
                    Upload Foto / Scan Dokumen ke Google Drive
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Otomatis diberi akses publik (semua user & HP bisa melihat)
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Publik Otomatis</span>
              </span>
            </div>

            {/* Folder Target Banner */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <FolderCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate text-slate-600 text-[11px]">
                  Folder Tujuan: <strong>{driveFolderId || 'SIMPERIZINAN_BERKAS_HOTEL (Otomatis)'}</strong>
                </span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowFolderSettings(!showFolderSettings)}
                  className="text-blue-700 hover:text-blue-900 font-bold text-[11px] flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>{showFolderSettings ? 'Tutup Pengaturan' : 'Ubah Folder'}</span>
                </button>
              )}
            </div>

            {/* Admin Folder Customization Field */}
            {showFolderSettings && isAdmin && (
              <div className="p-3 bg-white rounded-xl border border-blue-300 space-y-1.5 animate-in fade-in duration-150">
                <label className="font-bold text-slate-800 text-[11px] block">
                  Tentukan ID Folder Google Drive Tempat Foto Disimpan:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFolderId}
                    onChange={(e) => setCustomFolderId(e.target.value)}
                    placeholder="Tempel Link Folder Drive atau Folder ID..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = extractDriveFolderId(customFolderId);
                      setCustomFolderId(clean);
                      if (onSaveDriveFolderId) onSaveDriveFolderId(clean);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Folder ini akan digunakan sebagai tempat menyimpan seluruh foto yang diupload admin maupun user.
                </p>
              </div>
            )}

            {/* Existing File Link */}
            {fileUrl && !selectedFile && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800 truncate">
                    {fileName || 'Dokumen_Perizinan_Tersimpan.pdf'}
                  </span>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center gap-1.5 flex-shrink-0 border border-blue-200 transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Buka di Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Image Thumbnail Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-48 flex items-center justify-center p-2">
                <img
                  src={imagePreview}
                  alt="Pratinjau Foto"
                  className="max-h-44 rounded-lg object-contain shadow-sm"
                />
              </div>
            )}

            {/* Selected File Notice */}
            {selectedFile && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-emerald-900 truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSelectedFile}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold ml-2 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            )}

            {/* File & Camera Picker */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="filePicker"
                accept=".pdf,image/*"
                capture="environment"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer shadow-sm"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              *Mendukung foto kamera langsung dari HP, gambar (JPG, PNG), dan dokumen PDF (maks 15 MB).
            </p>
          </div>

          {/* Row 7: Catatan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Tambahan / History Progress
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan tindak lanjut, kontak vendor, atau histori pengajuan..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadStatusText || 'Sedang Menyimpan...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editLicense ? 'Simpan Perubahan' : 'Simpan Izin & Unggah Foto'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
