import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, Loader2 } from 'lucide-react';
import { LicenseItem } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  license: LicenseItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  license,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !license) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Hapus Data Perizinan</h3>
              <p className="text-[11px] text-rose-100">Tindakan ini permanen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Apakah Anda yakin ingin menghapus data ini?</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Data perizinan ini akan dihapus dari sistem aplikasi dan dari baris database Google Sheets yang terhubung.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-700">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Nama Dokumen / Izin:
              </span>
              <p className="font-bold text-slate-900 text-sm">{license.documentName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block">Nomor SK:</span>
                <span className="font-mono font-semibold text-slate-800">{license.licenseNumber || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Instansi:</span>
                <span className="font-semibold text-slate-800">{license.issuer || '-'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block">Kedaluwarsa:</span>
                <span className="font-mono text-slate-800">{license.expiryDate || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">PIC:</span>
                <span className="font-semibold text-slate-800">{license.picName || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
