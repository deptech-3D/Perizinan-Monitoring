import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  LicenseTable 
} from './components/LicenseTable';
import { 
  LicenseModal 
} from './components/LicenseModal';
import { 
  EmailSimulatorView 
} from './components/EmailSimulatorView';
import { 
  UserManagementView 
} from './components/UserManagementView';
import { 
  CodeExportView 
} from './components/CodeExportView';
import { 
  LoginView 
} from './components/LoginView';
import { 
  GoogleSyncBar 
} from './components/GoogleSyncBar';
import { 
  GoogleSyncModal 
} from './components/GoogleSyncModal';
import { 
  HomeDashboardView 
} from './components/HomeDashboardView';
import { 
  BottomNav 
} from './components/BottomNav';
import { 
  LicenseItem, 
  UserAccount, 
  GoogleConnectionConfig 
} from './types';
import { 
  INITIAL_LICENSES, 
  INITIAL_USERS 
} from './data/initialData';
import { 
  calculateRemainingDays, 
  generateEmailHtmlTemplate 
} from './utils/licenseUtils';
import { 
  getStoredWebAppUrl, 
  setStoredWebAppUrl, 
  getStoredAutoSync, 
  setStoredAutoSync, 
  fetchLicensesFromGoogleSheets, 
  saveLicenseToGoogleSheets, 
  deleteLicenseFromGoogleSheets,
  batchSaveLicensesToGoogleSheets,
  extractDriveFolderId,
  fetchUsersFromGoogleSheets,
  saveUserToGoogleSheets,
  SyncStatus
} from './services/googleSyncService';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import {
  fetchServerLicenses,
  saveServerLicenses,
  deleteServerLicense,
  fetchServerUsers,
  saveServerUsers,
  fetchServerConfig,
  saveServerConfig
} from './services/serverSyncService';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  RotateCcw,
  Sparkles,
  Mail,
  Send
} from 'lucide-react';

export default function App() {
  // LocalStorage-backed state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('simperizinan_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [licenses, setLicenses] = useState<LicenseItem[]>(() => {
    const saved = localStorage.getItem('simperizinan_licenses');
    if (!saved) return INITIAL_LICENSES;
    try {
      const parsed: LicenseItem[] = JSON.parse(saved);
      // Clean out any stale default dummy mock items
      const cleaned = parsed.filter(item => 
        !item.licenseNumber?.includes('DAMKAR/REK-PROT') &&
        !item.licenseNumber?.includes('SIPA-AT/BWS-KAL') &&
        !item.licenseNumber?.includes('LSU-PAR/CERT-089') &&
        !item.licenseNumber?.includes('SLO-TRF/1000KVA/LPE/2016')
      );
      if (cleaned.length === 0) {
        localStorage.setItem('simperizinan_licenses', JSON.stringify(INITIAL_LICENSES));
        return INITIAL_LICENSES;
      }
      return cleaned;
    } catch {
      return INITIAL_LICENSES;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('simperizinan_users');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        const cleaned = parsed.filter(u => u.id !== 'usr-2' && u.id !== 'usr-3' && u.username !== 'staff' && u.username !== 'hendra');
        localStorage.setItem('simperizinan_users', JSON.stringify(cleaned));
        return cleaned.length > 0 ? cleaned : INITIAL_USERS;
      } catch {}
    }
    return INITIAL_USERS;
  });

  // Google Sheets Live Connection State
  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    const stored = getStoredWebAppUrl();
    return stored || 'https://script.google.com/macros/s/AKfycbwdCvmEEQ9rRCS7fB4zGeJqGlT1y-b6pHhnmpfNBtCn8K9D52PwKTphmlWqYDQTV0tRKg/exec';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return localStorage.getItem('simperizinan_spreadsheet_url') || '';
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => getStoredAutoSync());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [driveFolderId, setDriveFolderId] = useState<string>(() => localStorage.getItem('simperizinan_drive_folder') || '1B53s98xT6FCFQwooHSQgX4_L3Px1qglf');

  // Active view: 'home' matches the user's mobile app screenshot!
  const [activeTab, setActiveTab] = useState<string>('home');
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseItem | null>(null);

  // Quick Manual Email Modal state
  const [manualEmailItem, setManualEmailItem] = useState<LicenseItem | null>(null);

  // In-app Delete Confirmation Modal
  const [deletingLicense, setDeletingLicense] = useState<LicenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    localStorage.setItem('simperizinan_licenses', JSON.stringify(licenses));
  }, [licenses]);

  // Sync across browser tabs on the same computer
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'simperizinan_licenses' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setLicenses(updated);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('simperizinan_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('simperizinan_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('simperizinan_user');
    }
  }, [currentUser]);

  // Synchronize with Google Sheets
  const performSync = useCallback(async (silent = false) => {
    // Prefer spreadsheetUrl if provided by admin, otherwise webAppUrl
    const targetUrl = (spreadsheetUrl && spreadsheetUrl.trim()) || (webAppUrl && webAppUrl.trim());

    if (!targetUrl) {
      if (!silent) {
        setIsSyncModalOpen(true);
        showToast('Penyebab data belum terupdate: Belum ada URL Google Spreadsheet atau Apps Script yang terhubung.', 'info');
      }
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      let res = await fetchLicensesFromGoogleSheets(targetUrl);

      // If targetUrl failed and alternative URL exists, try alternative URL
      if (!res.success && spreadsheetUrl && webAppUrl) {
        const altUrl = targetUrl === spreadsheetUrl ? webAppUrl : spreadsheetUrl;
        if (altUrl && altUrl !== targetUrl) {
          const altRes = await fetchLicensesFromGoogleSheets(altUrl);
          if (altRes.success) {
            res = altRes;
          }
        }
      }

      if (res.success && res.data) {
        setLicenses(res.data);
        saveServerLicenses(res.data);
        const timeNow = new Date().toLocaleTimeString('id-ID');
        setLastSyncedAt(timeNow);
        if (!silent) {
          showToast(`Berhasil menyinkronkan ${res.data.length} data perizinan dari Google Sheets!`, 'success');
        }
      } else {
        setSyncError(res.message || 'Gagal mengambil data dari Google Sheets.');
        if (!silent) {
          showToast(res.message || 'Gagal menyinkronkan data dari Google Sheets.', 'error');
        }
      }
    } catch (err: any) {
      setSyncError(err.message || 'Gagal terhubung');
      if (!silent) {
        showToast(`Gagal sync: ${err.message}`, 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [webAppUrl, spreadsheetUrl]);

  // Cross-device sync (PC & HP): Fetch shared server data on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1. Sync config (webAppUrl & driveFolderId & spreadsheetUrl) across devices
      const srvCfg = await fetchServerConfig();
      if (mounted && srvCfg) {
        if (srvCfg.webAppUrl && srvCfg.webAppUrl !== webAppUrl) {
          setWebAppUrl(srvCfg.webAppUrl);
          setStoredWebAppUrl(srvCfg.webAppUrl);
        }
        if (srvCfg.spreadsheetUrl && srvCfg.spreadsheetUrl !== spreadsheetUrl) {
          setSpreadsheetUrl(srvCfg.spreadsheetUrl);
          localStorage.setItem('simperizinan_spreadsheet_url', srvCfg.spreadsheetUrl);
        }
        if (srvCfg.driveFolderId && srvCfg.driveFolderId !== driveFolderId) {
          setDriveFolderId(srvCfg.driveFolderId);
          localStorage.setItem('simperizinan_drive_folder', srvCfg.driveFolderId);
        }
      }

      // 2. Sync licenses across devices
      const srvLicenses = await fetchServerLicenses();
      if (mounted && srvLicenses && srvLicenses.length > 0) {
        setLicenses(srvLicenses);
        localStorage.setItem('simperizinan_licenses', JSON.stringify(srvLicenses));
      } else if (mounted && licenses.length > 0) {
        saveServerLicenses(licenses);
      }

      // 3. Sync users across devices (PC and HP) and Google Sheets
      let activeUsers = users;
      const srvUsers = await fetchServerUsers();
      if (mounted && srvUsers && srvUsers.length > 0) {
        const cleaned = srvUsers.filter(u => u.id !== 'usr-2' && u.id !== 'usr-3' && u.username !== 'staff' && u.username !== 'hendra');
        activeUsers = cleaned;
        setUsers(cleaned);
        localStorage.setItem('simperizinan_users', JSON.stringify(cleaned));
      } else if (mounted && users.length > 0) {
        saveServerUsers(users);
      }

      // Sync users from Google Sheets (Sheet "Users") if connected
      const targetUrl = (srvCfg && srvCfg.webAppUrl) || webAppUrl;
      if (targetUrl && targetUrl.startsWith('http')) {
        try {
          const gsUsers = await fetchUsersFromGoogleSheets(targetUrl);
          if (mounted && gsUsers.success && gsUsers.data && gsUsers.data.length > 0) {
            const userMap = new Map<string, UserAccount>();
            activeUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));
            gsUsers.data.forEach((u) => {
              const key = u.username.toLowerCase();
              userMap.set(key, { ...(userMap.get(key) || {}), ...u });
            });
            const mergedUsers = Array.from(userMap.values());
            setUsers(mergedUsers);
            localStorage.setItem('simperizinan_users', JSON.stringify(mergedUsers));
            saveServerUsers(mergedUsers);
          }
        } catch {
          // ignore background sync errors
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Periodic poll to keep HP and PC in sync
  useEffect(() => {
    const interval = setInterval(async () => {
      const srvLicenses = await fetchServerLicenses();
      if (srvLicenses && srvLicenses.length > 0) {
        setLicenses(srvLicenses);
      }
      if (autoSync && webAppUrl) {
        performSync(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoSync, webAppUrl, performSync]);

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    setStoredAutoSync(nextVal);
    showToast(nextVal ? 'Auto-Sync aktif: data diperiksa setiap 30 detik.' : 'Auto-Sync dinonaktifkan.', 'info');
  };

  const handleSaveWebAppUrl = async (newUrl: string) => {
    setWebAppUrl(newUrl);
    setStoredWebAppUrl(newUrl);
    saveServerConfig(newUrl);

    if (newUrl) {
      setIsSyncing(true);
      const res = await fetchLicensesFromGoogleSheets(newUrl);
      setIsSyncing(false);
      if (res.success && res.data) {
        setLicenses(res.data);
        saveServerLicenses(res.data);
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID'));
        showToast(`Tersambung ke Google Sheets! ${res.data.length} data izin berhasil ditarik & disinkronkan ke HP.`, 'success');
        setIsSyncModalOpen(false);
      } else {
        showToast(res.message || 'Tersimpan, namun data gagal ditarik.', 'error');
      }
    } else {
      showToast('Koneksi Google Apps Script diputuskan.', 'info');
      setIsSyncModalOpen(false);
    }
  };

  const handleSaveDriveFolderId = async (folderId: string) => {
    const cleanId = extractDriveFolderId(folderId);
    setDriveFolderId(cleanId);
    localStorage.setItem('simperizinan_drive_folder', cleanId);
    await saveServerConfig(undefined, cleanId);
    showToast('Folder Google Drive tujuan foto berhasil disimpan!', 'success');
  };

  const handleSaveAdminConfig = async (newUrl: string, newFolderId: string, newSpreadsheetUrl?: string): Promise<boolean> => {
    try {
      if (newUrl) {
        setWebAppUrl(newUrl);
        setStoredWebAppUrl(newUrl);
      }
      if (newSpreadsheetUrl !== undefined) {
        setSpreadsheetUrl(newSpreadsheetUrl);
        localStorage.setItem('simperizinan_spreadsheet_url', newSpreadsheetUrl);
      }
      if (newFolderId) {
        const cleanId = extractDriveFolderId(newFolderId);
        setDriveFolderId(cleanId);
        localStorage.setItem('simperizinan_drive_folder', cleanId);
      }
      const cleanFolder = extractDriveFolderId(newFolderId);
      await saveServerConfig(newUrl || undefined, cleanFolder || undefined, newSpreadsheetUrl);
      showToast('Konfigurasi Google Cloud (Web App / Sheets & Google Drive) berhasil disimpan permanen!', 'success');
      return true;
    } catch (err: any) {
      showToast(`Gagal menyimpan konfigurasi: ${err.message}`, 'error');
      return false;
    }
  };

  const handleSyncUsers = async () => {
    const targetUrl = webAppUrl || spreadsheetUrl;
    if (!targetUrl || !targetUrl.startsWith('http')) {
      showToast('URL Google Apps Script atau Spreadsheet belum diisi.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetchUsersFromGoogleSheets(targetUrl);
      if (res.success && res.data && res.data.length > 0) {
        const userMap = new Map<string, UserAccount>();
        users.forEach((u) => userMap.set(u.username.toLowerCase(), u));
        res.data.forEach((u) => {
          const key = u.username.toLowerCase();
          userMap.set(key, { ...(userMap.get(key) || {}), ...u });
        });
        const merged = Array.from(userMap.values());
        setUsers(merged);
        localStorage.setItem('simperizinan_users', JSON.stringify(merged));
        await saveServerUsers(merged);
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID'));
        showToast(`Berhasil menyinkronkan ${res.data.length} akun pengguna dari sheet Users!`, 'success');
      } else {
        for (const u of users) {
          await saveUserToGoogleSheets(targetUrl, u);
        }
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID'));
        showToast(`Berhasil mengunggah ${users.length} akun pengguna lokal ke sheet Users di Google Spreadsheet!`, 'success');
      }
    } catch (err: any) {
      showToast(`Gagal sinkron akun: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await performSync(false);
    await handleSyncUsers();
    setIsSyncing(false);
  };

  const handleManualImport = (importedLicenses: LicenseItem[]) => {
    setLicenses(importedLicenses);
    setLastSyncedAt(new Date().toLocaleTimeString('id-ID'));
    showToast(`Berhasil mengimpor ${importedLicenses.length} data perizinan!`, 'success');
  };

  const handleImportCsv = async (importedLicenses: LicenseItem[], mode: 'merge' | 'replace') => {
    let nextLicenses: LicenseItem[] = [];

    if (mode === 'replace') {
      nextLicenses = importedLicenses;
      setLicenses(importedLicenses);
      showToast(`Mengganti data lokal dengan ${importedLicenses.length} data izin dari CSV.`, 'info');
    } else {
      // Merge: update existing if ID matches, or add if new
      const existingMap = new Map(licenses.map(item => [item.id, item]));
      importedLicenses.forEach(item => {
        existingMap.set(item.id, item);
      });
      nextLicenses = Array.from(existingMap.values());
      setLicenses(nextLicenses);
      showToast(`Berhasil mengimpor & menggabungkan ${importedLicenses.length} data izin!`, 'info');
    }

    // SIMPAN KE SERVER AGAR HP & SEMUA PERANGKAT LANGSUNG SINKRON
    saveServerLicenses(nextLicenses);

    // SIMPAN KE GOOGLE SHEETS AGAR HP TERSINKRONISASI OTOMATIS
    if (webAppUrl && webAppUrl.startsWith('http')) {
      showToast('Menyimpan ke Google Sheets agar sinkron ke HP...', 'info');
      try {
        const batchRes = await batchSaveLicensesToGoogleSheets(webAppUrl, mode === 'replace' ? nextLicenses : importedLicenses);
        if (batchRes.success) {
          showToast(`✅ Berhasil! Data tersimpan di Google Sheets & siap diakses dari HP!`, 'success');
          setLastSyncedAt(new Date().toLocaleTimeString('id-ID'));
        } else {
          showToast(`Data tersimpan di browser ini. Status Google Sheets: ${batchRes.message}`, 'info');
        }
      } catch (err: any) {
        showToast(`Catatan sync Google Sheets: ${err.message}`, 'error');
      }
    }
  };

  // Counts for navbar badges
  const { h60Count, expiredCount } = React.useMemo(() => {
    let h60 = 0;
    let exp = 0;
    licenses.forEach((item) => {
      if (item.status === 'Selesai') return;
      const days = calculateRemainingDays(item.expiryDate);
      if (days < 0) exp++;
      else if (days <= 60) h60++;
    });
    return { h60Count: h60, expiredCount: exp };
  }, [licenses]);

  // Handlers for License CRUD
  const handleAddLicenseClick = () => {
    setEditingLicense(null);
    setIsModalOpen(true);
  };

  const handleEditLicenseClick = (license: LicenseItem) => {
    setEditingLicense(license);
    setIsModalOpen(true);
  };

  const handleSaveLicense = async (
    data: Partial<LicenseItem>,
    fileData?: { name: string; size: string; base64: string }
  ) => {
    if (editingLicense) {
      // Update
      const updated = licenses.map((item) => {
        if (item.id === editingLicense.id) {
          return {
            ...item,
            ...data,
            fileName: fileData ? fileData.name : item.fileName,
            fileSize: fileData ? fileData.size : item.fileSize,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          } as LicenseItem;
        }
        return item;
      });
      setLicenses(updated);
      saveServerLicenses(updated);
      showToast(`Data "${data.documentName}" berhasil diperbarui!`, 'success');

      // Sync to Google Sheets if connected
      if (webAppUrl) {
        saveLicenseToGoogleSheets(webAppUrl, { ...data, id: editingLicense.id });
      }
    } else {
      // Insert new
      const newId = `LIC-2026-${String(licenses.length + 1).padStart(3, '0')}`;
      const newItem: LicenseItem = {
        id: newId,
        documentName: data.documentName || 'Dokumen Izin',
        licenseNumber: data.licenseNumber || '-',
        issuer: data.issuer || '-',
        issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: data.expiryDate || new Date().toISOString().slice(0, 10),
        picName: data.picName || 'PIC',
        picEmail: data.picEmail || 'pic@example.com',
        fileUrl: data.fileUrl || `https://drive.google.com/file/d/mock-${Date.now()}/view`,
        fileName: fileData ? fileData.name : 'Scan_Izin_Dokumen.pdf',
        fileSize: fileData ? fileData.size : '2.4 MB',
        status: data.status || 'Belum Diproses',
        notes: data.notes || '',
        lastNotifSent: '-',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      const nextList = [newItem, ...licenses];
      setLicenses(nextList);
      saveServerLicenses(nextList);
      showToast(`Izin baru "${newItem.documentName}" berhasil disimpan!`, 'success');

      // Sync to Google Sheets if connected
      if (webAppUrl) {
        saveLicenseToGoogleSheets(webAppUrl, newItem);
      }
    }
  };

  const handleDeleteLicense = (license: LicenseItem) => {
    if (currentUser?.role !== 'Admin') {
      showToast('Hanya role Admin yang memiliki izin untuk menghapus data!', 'error');
      return;
    }
    setDeletingLicense(license);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLicense) return;
    setIsDeleting(true);
    const targetId = deletingLicense.id;
    const targetName = deletingLicense.documentName;

    // Remove locally and on shared server
    setLicenses((prev) => prev.filter((l) => l.id !== targetId));
    deleteServerLicense(targetId);
    showToast(`Data perizinan "${targetName}" berhasil dihapus.`, 'info');

    // Remove from Google Sheets
    if (webAppUrl) {
      try {
        await deleteLicenseFromGoogleSheets(webAppUrl, targetId);
      } catch (err: any) {
        console.error('Failed to delete on Google Sheets', err);
      }
    }

    setIsDeleting(false);
    setDeletingLicense(null);
  };

  const handleSendManualReminder = (license: LicenseItem) => {
    setManualEmailItem(license);
  };

  const executeSendManualEmail = () => {
    if (!manualEmailItem) return;
    
    // Update lastNotifSent
    const updated = licenses.map((item) => {
      if (item.id === manualEmailItem.id) {
        return {
          ...item,
          lastNotifSent: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return item;
    });
    setLicenses(updated);
    showToast(`Email pengingat H-60 berhasil dikirim ke ${manualEmailItem.picEmail} via GmailApp!`, 'success');
    setManualEmailItem(null);
  };

  // Handlers for User Management
  const handleAddUser = (newUser: Omit<UserAccount, 'id'>) => {
    const id = `usr-${Date.now()}`;
    const userWithId: UserAccount = { id, ...newUser };
    const nextUsers = [...users, userWithId];
    setUsers(nextUsers);
    localStorage.setItem('simperizinan_users', JSON.stringify(nextUsers));
    saveServerUsers(nextUsers);

    // Sync to Google Sheets if connected
    if (webAppUrl && webAppUrl.startsWith('http')) {
      saveUserToGoogleSheets(webAppUrl, userWithId);
    }
    showToast(`Akun @${newUser.username} (${newUser.role}) berhasil didaftarkan dan dapat langsung login!`, 'success');
  };

  const handleUpdateUser = (id: string, updated: Partial<UserAccount>) => {
    const nextUsers = users.map((u) => (u.id === id ? { ...u, ...updated } : u));
    setUsers(nextUsers);
    localStorage.setItem('simperizinan_users', JSON.stringify(nextUsers));
    saveServerUsers(nextUsers);

    const targetUser = nextUsers.find(u => u.id === id);
    if (targetUser && webAppUrl && webAppUrl.startsWith('http')) {
      saveUserToGoogleSheets(webAppUrl, targetUser);
    }
    showToast('Data akun pengguna berhasil diperbarui.', 'success');
  };

  const handleDeleteUser = (id: string) => {
    const nextUsers = users.filter((u) => u.id !== id);
    setUsers(nextUsers);
    localStorage.setItem('simperizinan_users', JSON.stringify(nextUsers));
    saveServerUsers(nextUsers);
    showToast('Akun pengguna berhasil dihapus.', 'info');
  };

  const handleLogout = () => {
    localStorage.removeItem('simperizinan_user');
    setCurrentUser(null);
    showToast('Anda telah berhasil keluar dari akun.', 'info');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    localStorage.setItem('simperizinan_user', JSON.stringify(user));
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.fullName || user.username}!`, 'success');
  };

  const handleResetData = () => {
    if (confirm('Reset seluruh data perizinan dan user ke contoh default awal?')) {
      setLicenses(INITIAL_LICENSES);
      setUsers(INITIAL_USERS);
      localStorage.setItem('simperizinan_users', JSON.stringify(INITIAL_USERS));
      saveServerUsers(INITIAL_USERS);
      showToast('Data berhasil di-reset ke nilai default pabrik.', 'info');
    }
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginView 
        users={users} 
        webAppUrl={webAppUrl}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleAddUser}
      />
    );
  }

  const syncStatusObject: SyncStatus = {
    isConnected: Boolean(webAppUrl && webAppUrl.trim().length > 0),
    webAppUrl: webAppUrl,
    lastSyncedAt: lastSyncedAt,
    isLoading: isSyncing,
    errorMessage: syncError,
    autoSync: autoSync
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
                : toast.type === 'error'
                ? 'bg-slate-900 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-blue-400 border-blue-500/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        h60Count={h60Count}
        expiredCount={expiredCount}
        syncStatus={syncStatusObject}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onManualSync={() => performSync(false)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 pb-28">
        {/* 1. Home Dashboard View (Matches Mobile App Screenshot) */}
        {activeTab === 'home' && (
          <HomeDashboardView
            licenses={licenses}
            currentUser={currentUser}
            syncStatus={syncStatusObject}
            onSelectLicense={(license) => {
              setEditingLicense(license);
              setIsModalOpen(true);
            }}
            onNavigateTab={(tab, filter) => {
              if (filter) setTableFilter(filter);
              setActiveTab(tab);
            }}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {/* 2. Google Sync Status Bar shown prominently on Licenses Tab */}
        {activeTab === 'licenses' && (
          <GoogleSyncBar
            syncStatus={syncStatusObject}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onManualSync={() => performSync(false)}
            onToggleAutoSync={handleToggleAutoSync}
          />
        )}

        {activeTab === 'licenses' && (
          <LicenseTable
            licenses={licenses}
            currentUser={currentUser}
            onAddLicense={handleAddLicenseClick}
            onEditLicense={handleEditLicenseClick}
            onDeleteLicense={handleDeleteLicense}
            onSendManualReminder={handleSendManualReminder}
            onRefreshData={() => performSync(false)}
            onImportCsv={handleImportCsv}
            isSyncing={isSyncing}
            defaultFilter={tableFilter}
          />
        )}

        {activeTab === 'reminder-simulator' && (
          <EmailSimulatorView
            licenses={licenses}
            adminEmail={currentUser.email || 'admengmidtownhotelsmd@gmail.com'}
            onUpdateLicenses={(updated) => setLicenses(updated)}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'Admin' && (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            webAppUrl={webAppUrl}
            spreadsheetUrl={spreadsheetUrl}
            driveFolderId={driveFolderId}
            onSaveConfig={handleSaveAdminConfig}
            onSyncAll={handleSyncAll}
            onSyncLicenses={() => performSync(false)}
            onSyncUsers={handleSyncUsers}
            isSyncing={isSyncing}
            lastSyncedAt={lastSyncedAt}
            licenseCount={licenses.length}
          />
        )}

        {activeTab === 'code-export' && (
          <CodeExportView 
            initialSpreadsheetUrl={spreadsheetUrl || webAppUrl}
            initialDriveFolderId={driveFolderId}
          />
        )}
      </main>

      {/* Add / Edit License Modal */}
      <LicenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLicense}
        editLicense={editingLicense}
        webAppUrl={webAppUrl}
        driveFolderId={driveFolderId}
        onSaveDriveFolderId={handleSaveDriveFolderId}
        isAdmin={currentUser?.role === 'Admin'}
      />

      {/* In-app Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingLicense}
        license={deletingLicense}
        onClose={() => setDeletingLicense(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Google Sheets Connection Modal */}
      <GoogleSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        webAppUrl={webAppUrl}
        driveFolderId={driveFolderId}
        onSaveUrl={handleSaveWebAppUrl}
        onSaveDriveFolder={handleSaveDriveFolderId}
        onManualImport={handleManualImport}
      />

      {/* Manual Email Reminder Confirmation Modal */}
      {manualEmailItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Kirim Notifikasi Pengingat Manual?</h3>
                <p className="text-xs text-slate-500">Kirim email langsung via GmailApp</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 my-4">
              <div>
                <span className="text-slate-500">Dokumen:</span>{' '}
                <strong className="text-slate-900">{manualEmailItem.documentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">No. SK:</span>{' '}
                <code className="text-slate-700 font-mono">{manualEmailItem.licenseNumber}</code>
              </div>
              <div>
                <span className="text-slate-500">Penerima (PIC):</span>{' '}
                <strong className="text-blue-700">{manualEmailItem.picEmail}</strong> ({manualEmailItem.picName})
              </div>
              <div>
                <span className="text-slate-500">Tembusan (CC):</span>{' '}
                <code className="text-slate-700">{currentUser.email || 'admengmidtownhotelsmd@gmail.com'}</code>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManualEmailItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeSendManualEmail}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Notifikasi Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom Status Bar */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SIMPERIZINAN</span>
            <span>&bull;</span>
            <span>Google Apps Script, Google Sheets, Google Drive Ecosystem</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              title="Reset contoh data ke bawaan awal"
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
            <span>&bull;</span>
            <span className="text-emerald-600 font-medium">Auto-Sync Google Cloud Ready</span>
          </div>
        </div>
      </footer>

      {/* Persistent Bottom Mobile Navigation Bar (Exact Match to Screenshot) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onResetData={handleResetData}
      />
    </div>
  );
}

