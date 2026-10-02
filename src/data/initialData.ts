import { LicenseItem, UserAccount } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'admin',
    fullName: 'Admin Engineering (Super Admin)',
    email: 'admengmidtownhotelsmd@gmail.com',
    role: 'Admin',
    password: 'admin',
    active: true,
    lastLogin: '2026-09-29 19:40'
  }
];

export const INITIAL_LICENSES: LicenseItem[] = [
  {
    id: 'LIC-2026-001',
    documentName: 'Sertifikat Laik Fungsi (SLF) Bangunan Gedung Hotel',
    licenseNumber: '503/SLF-BG/DPMPTSP/X/2023',
    issuer: 'DPMPTSP & Dinas PUPR Kota',
    issueDate: '2023-10-18',
    expiryDate: '2026-10-18',
    picName: 'Hendra Wijaya (Chief Engineer)',
    picEmail: 'admengmidtownhotelsmd@gmail.com',
    fileUrl: 'https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345/view',
    fileName: 'SLF_Bangunan_Gedung_Hotel_2023-2026.pdf',
    fileSize: '4.2 MB',
    status: 'Dalam Proses',
    notes: 'Sidang berkas TABG (Tim Ahli Bangunan Gedung) tahap 2 telah selesai diajukan.',
    lastNotifSent: 'Mon Sep 28 2026 15:00:00 GMT+0800 (China Standard Time)'
  },
  {
    id: 'LIC-2026-002',
    documentName: 'Sertifikat Laik Higiene Sanitasi Jasa Boga & Restoran Hotel',
    licenseNumber: '440/SLHS-JABOG/DINKES/2025',
    issuer: 'Dinas Kesehatan Kota',
    issueDate: '2025-11-20',
    expiryDate: '2026-11-20',
    picName: 'Ratna Dewi (Food & Beverage Manager)',
    picEmail: 'admengmidtownhotelsmd@gmail.com',
    fileUrl: 'https://drive.google.com/file/d/1gHiJkLmNoPqRsTuVwXyZAbcde678901/view',
    fileName: 'Sertifikat_Higiene_Sanitasi_Dinkes.pdf',
    fileSize: '1.5 MB',
    status: 'Belum Diproses',
    notes: 'Hasil swab rektal penjamah makanan (cook & steward) perlu diperbarui.',
    lastNotifSent: 'Tue Sep 29 2026 15:00:00 GMT+0800 (China Standard Time)'
  },
  {
    id: 'LIC-2026-003',
    documentName: 'Surat Keterangan Pemeriksaan dan Pengujian K3 Genset',
    licenseNumber: '500.15.18.1/3058/DISNAKER-K3/III/2026',
    issuer: 'Disnakertrans Provinsi (Pengawas K3)',
    issueDate: '2026-03-11',
    expiryDate: '2027-02-01',
    picName: 'Hendra Wijaya (Chief Engineer)',
    picEmail: 'admengmidtownhotelsmd@gmail.com',
    fileUrl: 'https://drive.google.com/file/d/1cDeFgHiJkLmNoPqRsTuVwXyZa234567/view',
    fileName: 'Suket_Riksa_Uji_K3_Genset_Disnaker.pdf',
    fileSize: '3.1 MB',
    status: 'Belum Diproses',
    notes: 'Tidak ada tanggal kedaluwarsa tertulis, uji riksa berkala 1 tahun.',
    lastNotifSent: 'Sat Sep 26 2026 04:00:00 GMT+0800 (China Standard Time)'
  },
  {
    id: 'LIC-2026-004',
    documentName: 'Surat Keterangan Kelaikan K3 Pesawat Angkat & Angkut (Lift Penumpang)',
    licenseNumber: '500.15.18.2/3090/DISNAKER-K3/III/2026',
    issuer: 'Disnakertrans Provinsi (Pengawas K3)',
    issueDate: '2026-03-02',
    expiryDate: '2027-02-26',
    picName: 'Hendra Wijaya (Chief Engineer)',
    picEmail: 'admengmidtownhotelsmd@gmail.com',
    fileUrl: 'https://drive.google.com/file/d/1bCdEfGhIjKlMnOpQrStUvWxYz123456/view',
    fileName: 'Suket_K3_Lift_Penumpang_Disnaker.pdf',
    fileSize: '2.8 MB',
    status: 'Belum Diproses',
    notes: 'Uji riksa berkala kelaikan K3 lift penumpang unit 1 & 2.',
    lastNotifSent: 'Sun Sep 27 2026 04:00:00 GMT+0800 (China Standard Time)'
  },
  {
    id: 'LIC-2026-005',
    documentName: 'Surat Keterangan Kelaikan K3 Pesawat Angkat & Angkut (Lift Service)',
    licenseNumber: '500.15.18.2/3088/DISNAKER-K3/III/2026',
    issuer: 'Disnakertrans Provinsi (Pengawas K3)',
    issueDate: '2026-03-02',
    expiryDate: '2027-02-26',
    picName: 'Budi Santoso (Staff Penginput)',
    picEmail: 'staff.engineering@midtownhotel.co.id',
    fileUrl: 'https://drive.google.com/file/d/1bCdEfGhIjKlMnOpQrStUvWxYz123456/view',
    fileName: 'Suket_K3_Lift_Service_Disnaker.pdf',
    fileSize: '2.6 MB',
    status: 'Belum Diproses',
    notes: 'Uji riksa berkala kelaikan K3 lift service unit.',
    lastNotifSent: 'Thu Sep 24 2026 04:00:00 GMT+0800 (China Standard Time)'
  },
  {
    id: 'LIC-2026-006',
    documentName: 'Sertifikat Pengesahan Pemakaian Instalasi Penyalur Petir',
    licenseNumber: '500.15.18.2/3056/DISNAKER-K3/III/2026',
    issuer: 'Disnakertrans Provinsi (Pengawas K3)',
    issueDate: '2026-03-02',
    expiryDate: '2028-03-02',
    picName: 'Hendra Wijaya (Chief Engineer)',
    picEmail: 'admengmidtownhotelsmd@gmail.com',
    fileUrl: 'https://drive.google.com/file/d/1hIjKlMnOpQrStUvWxYzAbcdef789012/view',
    fileName: 'Suket_Pengesahan_Penyalur_Petir_Disnaker.pdf',
    fileSize: '2.1 MB',
    status: 'Belum Diproses',
    notes: 'Pengesahan instalasi proteksi penyalur petir & sistem pembumian.',
    lastNotifSent: 'Thu Sep 24 2026 04:00:00 GMT+0800 (China Standard Time)'
  }
];
