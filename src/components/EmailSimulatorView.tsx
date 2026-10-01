import React, { useState } from 'react';
import { 
  BellRing, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Terminal, 
  Send, 
  Clock, 
  FileText, 
  ExternalLink,
  Info
} from 'lucide-react';
import { LicenseItem, H60NotificationLog } from '../types';
import { calculateRemainingDays, generateEmailHtmlTemplate, formatDateIndo, getHumanDuration } from '../utils/licenseUtils';

interface EmailSimulatorViewProps {
  licenses: LicenseItem[];
  adminEmail: string;
  onUpdateLicenses: (updated: LicenseItem[]) => void;
}

export const EmailSimulatorView: React.FC<EmailSimulatorViewProps> = ({
  licenses,
  adminEmail,
  onUpdateLicenses
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [sentNotifications, setSentNotifications] = useState<H60NotificationLog[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<H60NotificationLog | null>(null);

  const runSimulation = () => {
    setIsRunning(true);
    setLogs([]);
    const newLogs: string[] = [];
    const notifications: H60NotificationLog[] = [];
    const updatedLicenses = [...licenses];

    const addLog = (msg: string) => {
      newLogs.push(`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`);
      setLogs([...newLogs]);
    };

    addLog('🚀 Memulai eksekusi fungsi: sendH60EmailReminder()...');
    addLog(`📅 Tanggal pemeriksaan sistem: ${new Date().toISOString().slice(0, 10)}`);
    addLog(`📋 Membaca data dari Google Sheets [Data_Perizinan]: ${licenses.length} baris...`);

    setTimeout(() => {
      let matchedCount = 0;

      licenses.forEach((item, index) => {
        const days = calculateRemainingDays(item.expiryDate);

        if (item.status === 'Selesai') {
          addLog(`⏩ [Lewati] #${item.id} - ${item.documentName}: Status 'Selesai' diperpanjang.`);
          return;
        }

        if (days <= 60) {
          matchedCount++;
          const isUrgent = days <= 30;
          const isExpired = days < 0;

          const dur = getHumanDuration(item.expiryDate);
          const statusDesc = isExpired 
            ? `LEWAT JATUH TEMPO (Lewat ${Math.abs(days) >= 30 ? dur.fullText : Math.abs(days) + ' Hari'})` 
            : `Sisa ${days} hari (Ambang batas H-60 terpenuhi)`;

          addLog(`⚠️ [DITEMUKAN] #${item.id} - ${item.documentName}: ${statusDesc}.`);
          addLog(`   &bull; Penerima: ${item.picEmail} (${item.picName})`);
          addLog(`   &bull; Tembusan (CC): ${adminEmail}`);

          const { subject, body } = generateEmailHtmlTemplate(item, days, adminEmail);

          const logItem: H60NotificationLog = {
            id: `notif-${Date.now()}-${index}`,
            licenseId: item.id,
            documentName: item.documentName,
            licenseNumber: item.licenseNumber,
            picName: item.picName,
            picEmail: item.picEmail,
            adminEmail: adminEmail,
            daysRemaining: days,
            expiryDate: item.expiryDate,
            sentAt: new Date().toLocaleString('id-ID'),
            status: 'Terkirim',
            htmlSubject: subject,
            htmlBody: body
          };

          notifications.push(logItem);

          // Update lastNotifSent on license item
          const idx = updatedLicenses.findIndex(l => l.id === item.id);
          if (idx !== -1) {
            updatedLicenses[idx] = {
              ...updatedLicenses[idx],
              lastNotifSent: new Date().toISOString().slice(0, 16).replace('T', ' ')
            };
          }

          addLog(`   &bull; GmailApp.sendEmail() -> BERHASIL TERKIRIM.`);
          addLog(`   &bull; Menulis timestamp ke Kolom M (Terakhir_Notif_Sent)...`);
        } else {
          addLog(`✅ [Aman] #${item.id} - ${item.documentName}: Sisa ${days} hari (> 60 hari).`);
        }
      });

      addLog(`✨ Eksekusi Time-driven Trigger selesai.`);
      addLog(`📊 Ringkasan: Total ${matchedCount} email peringatan H-60 berhasil diproses & dikirim.`);

      setSentNotifications(notifications);
      if (notifications.length > 0) {
        setSelectedPreview(notifications[0]);
      }
      onUpdateLicenses(updatedLicenses);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the Trigger */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Google Apps Script Time-driven Trigger (Cron Job Harian)</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Simulasi Pengingat Otomatis H-60 (GmailApp Engine)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fungsi ini berjalan setiap pagi (Pukul 07:00 WIB) di server Google Apps Script. 
              Sistem akan menghitung sisa hari: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">Sisa_Hari = Tanggal_Kedaluwarsa - Tanggal_Hari_Ini</code>.
              Jika sisa hari &le; 60 hari dan status belum "Selesai", email resmi pengingat otomatis dikirim ke PIC bersangkutan dan ditembuskan (CC) ke Admin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menjalankan Trigger...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Jalankan Cron Job Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick config badges */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Ambang Batas:</span>{' '}
            <strong className="text-amber-400">H-60 (60 Hari)</strong>
          </div>
          <div>
            <span className="text-slate-500">Email Admin (CC):</span>{' '}
            <strong className="text-slate-200">{adminEmail}</strong>
          </div>
          <div>
            <span className="text-slate-500">Jadwal Asli di GAS:</span>{' '}
            <strong className="text-emerald-400">Setiap Hari Pukul 07:00 - 08:00 WIB</strong>
          </div>
        </div>
      </div>

      {/* Main split grid: Terminal Log on Left, HTML Email Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Execution Logs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col h-[560px]">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-slate-200">Execution Log (Apps Script Console)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {logs.length} baris log
              </span>
            </div>

            <div className="p-4 font-mono text-xs text-slate-300 overflow-y-auto flex-1 space-y-1.5 leading-relaxed bg-slate-950 select-text">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 space-y-2">
                  <Play className="w-8 h-8 opacity-40" />
                  <p>Klik tombol <strong>"Jalankan Cron Job Sekarang"</strong> untuk memicu proses pengecekan tanggal kedaluwarsa.</p>
                </div>
              ) : (
                logs.map((line, idx) => (
                  <div
                    key={idx}
                    className={`break-words ${
                      line.includes('[DITEMUKAN]')
                        ? 'text-amber-300 font-bold bg-amber-500/10 px-1 py-0.5 rounded'
                        : line.includes('BERHASIL')
                        ? 'text-emerald-400 font-semibold'
                        : line.includes('🚀') || line.includes('✨')
                        ? 'text-blue-400 font-bold'
                        : 'text-slate-400'
                    }`}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))
              )}
            </div>
          </div>

          {/* List of generated emails */}
          {sentNotifications.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                Email Terkirim ({sentNotifications.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sentNotifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => setSelectedPreview(notif)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      selectedPreview?.id === notif.id
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="truncate">{notif.documentName}</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Ke: {notif.picEmail}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold flex-shrink-0">
                      H-{notif.daysRemaining}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Preview on Right */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[560px]">
            {/* Email Header Metadata */}
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Pratinjau Email Notifikasi H-60 (GmailApp)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Status: Siap Dikirim ke Inbox
                </span>
              </div>
              {selectedPreview ? (
                <div className="pt-2 text-[11px] space-y-0.5 text-slate-600">
                  <div>
                    <strong className="text-slate-700">Subjek:</strong> {selectedPreview.htmlSubject}
                  </div>
                  <div>
                    <strong className="text-slate-700">Kepada:</strong> {selectedPreview.picName} &lt;{selectedPreview.picEmail}&gt;
                  </div>
                  <div>
                    <strong className="text-slate-700">Tembusan (CC):</strong> {selectedPreview.adminEmail}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Belum ada email yang dipilih untuk pratinjau.
                </p>
              )}
            </div>

            {/* Email HTML Body Render */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
              {selectedPreview ? (
                <div
                  className="bg-white rounded-xl shadow-xs border border-slate-200"
                  dangerouslySetInnerHTML={{ __html: selectedPreview.htmlBody }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-3">
                  <Mail className="w-12 h-12 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    Pratinjau Email Belum Tersedia
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Tekan tombol "Jalankan Cron Job Sekarang" di sebelah kiri untuk melihat persis bagaimana email pengingat diformat dan dikirimkan oleh GmailApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
