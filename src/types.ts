export type UserRole = 'Admin' | 'Staff';

export type LicenseStatus = 'Belum Diproses' | 'Dalam Proses' | 'Selesai';

export interface LicenseItem {
  id: string;
  documentName: string; // Nama Dokumen / Jenis Izin
  licenseNumber: string; // Nomor Perizinan
  issuer: string; // Instansi Penerbit (misal DPMPTSP, Kemenaker, dll)
  issueDate: string; // Tanggal Terbit (YYYY-MM-DD)
  expiryDate: string; // Tanggal Kedaluwarsa (YYYY-MM-DD)
  picName: string; // Penanggung Jawab (PIC)
  picEmail: string; // Email PIC
  fileUrl: string; // Link Google Drive
  fileName?: string;
  fileSize?: string;
  status: LicenseStatus; // Status Perpanjangan
  notes?: string;
  lastNotifSent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  password?: string;
  active: boolean;
  lastLogin?: string;
}

export interface H60NotificationLog {
  id: string;
  licenseId: string;
  documentName: string;
  licenseNumber: string;
  picName: string;
  picEmail: string;
  adminEmail: string;
  daysRemaining: number;
  expiryDate: string;
  sentAt: string;
  status: 'Terkirim' | 'Gagal';
  htmlSubject: string;
  htmlBody: string;
}

export interface GoogleConnectionConfig {
  spreadsheetId: string;
  driveFolderId: string;
  adminEmail: string;
  webAppUrl: string;
  daysThreshold: number; // default 60
  isConnected: boolean;
}
