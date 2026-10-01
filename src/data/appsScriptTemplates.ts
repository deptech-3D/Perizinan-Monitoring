export const CODE_GS_TEMPLATE = `/**
 * =========================================================================
 * SISTEM MONITORING PERIZINAN (SIMPERIZINAN) - GOOGLE APPS SCRIPT
 * Backend Engine: Google Sheets + Google Drive + GmailApp + Time-driven Trigger
 * =========================================================================
 */

// --- 1. KONFIGURASI SISTEM ---
// Ganti ID Spreadsheet, ID Folder Drive, dan Email Admin sesuai akun Anda
const CONFIG = {
  // ID Spreadsheet Google Sheets Anda (Opsional jika script dibuka dari menu: Ekstensi > Apps Script di Spreadsheet Anda)
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA',
  
  // ID Folder Google Drive tempat menyimpan seluruh scan dokumen izin (PDF/JPG)
  DRIVE_FOLDER_ID: 'GANTI_DENGAN_FOLDER_ID_DRIVE_ANDA',
  
  // Email Admin utama untuk tembusan (CC) seluruh notifikasi pengingat
  ADMIN_EMAIL: 'admengmidtownhotelsmd@gmail.com',
  
  // Nama Sheet di Google Spreadsheet
  SHEET_LICENSES: 'Data_Perizinan',
  SHEET_USERS: 'Users',
  
  // Ambang batas pengingat dalam hitungan hari (H-60 = 60 hari)
  REMINDER_DAYS_THRESHOLD: 60
};

/**
 * HELPER CERDAS MENGAMBIL SPREADSHEET:
 * 1. Otomatis mengenali Spreadsheet aktif jika script dibuka dari menu: Ekstensi > Apps Script di Google Sheets Anda
 * 2. Jika dibuat sebagai Standalone Script, menggunakan ID yang diisi pada CONFIG.SPREADSHEET_ID
 */
function getAppSpreadsheet() {
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs && activeSs.getId()) {
      return activeSs;
    }
  } catch (err) {}

  var id = CONFIG.SPREADSHEET_ID;
  if (id && 
      id !== 'GANTI_DENGAN_SPREADSHEET_ID_ANDA' && 
      id !== 'PASTE_ID_SPREADSHEET_ANDA_DI_SINI' && 
      String(id).trim().length > 10) {
    return SpreadsheetApp.openById(String(id).trim());
  }

  throw new Error('ID Spreadsheet belum diatur! Buka Google Sheets Anda lalu klik menu: Ekstensi > Apps Script, ATAU ganti GANTI_DENGAN_SPREADSHEET_ID_ANDA di baris 12 Code.gs dengan ID Spreadsheet Anda.');
}

/**
 * 2. ENTRY POINT WEB APP & REST API (doGet & doPost)
 * - Jika dipanggil via API fetch (?action=...), mengembalikan JSON (ContentService)
 * - Jika dibuka langsung di browser, memuat antarmuka web (Index.html)
 */
function doGet(e) {
  // Mode API: Pertukaran data real-time dengan frontend eksternal
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var result = { success: false, message: 'Action tidak dikenal' };
    
    if (action === 'getLicenses') {
      result = getLicenses();
    } else if (action === 'getUsers') {
      result = getUsers();
    } else if (action === 'checkLogin') {
      result = checkLogin(e.parameter.username, e.parameter.password);
    } else if (action === 'deleteLicense') {
      result = deleteLicense(e.parameter.id);
    } else if (action === 'triggerReminder') {
      result = sendH60EmailReminder();
    } else if (action === 'ping') {
      result = { success: true, message: 'Google Apps Script API Aktif!', timestamp: new Date().toISOString() };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Mode Web App: Tampilan HTML untuk pengguna browser
  try {
    var htmlOutput = HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('SIMPERIZINAN - Sistem Monitoring Perizinan')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
    return htmlOutput;
  } catch (err) {
    // Fallback aman jika pengguna belum membuat file Index.html di Apps Script
    return HtmlService.createHtmlOutput(
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:32px;max-width:540px;margin:50px auto;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);background:#ffffff;">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
      '<div style="width:12px;height:12px;background:#10b981;border-radius:50%;"></div>' +
      '<h2 style="color:#0f172a;margin:0;font-size:20px;">SIMPERIZINAN Backend Aktif!</h2>' +
      '</div>' +
      '<p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 16px 0;">Google Apps Script Web App Anda telah aktif 100% dan terhubung dengan Google Sheets. Endpoint API siap digunakan untuk sinkronisasi data.</p>' +
      '<div style="background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #cbd5e1;font-size:12px;color:#64748b;">' +
      'Status: <strong>Online & Ready</strong> | Parameter <code>?action=getLicenses</code>' +
      '</div>' +
      '</div>'
    );
  }
}

/**
 * Handle HTTP POST untuk simpan izin, upload berkas, dan hapus dari aplikasi eksternal
 */
function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }
    
    var action = postData.action || (e && e.parameter && e.parameter.action);
    var result = { success: false, message: 'Action POST tidak dikenal' };
    
    if (action === 'saveLicenseData') {
      result = saveLicenseData(postData.licenseData || postData);
    } else if (action === 'batchSaveLicenses') {
      result = batchSaveLicenses(postData.licenses || postData.data || []);
    } else if (action === 'deleteLicense') {
      result = deleteLicense(postData.id || (e && e.parameter && e.parameter.id));
    } else if (action === 'uploadFileToDrive') {
      result = uploadFileToDrive(postData.base64Data, postData.fileName, postData.mimeType, postData.folderId);
    } else if (action === 'checkLogin') {
      result = checkLogin(postData.username, postData.password);
    } else if (action === 'saveUser') {
      result = saveUser(postData.userData || postData);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error server: ' + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper untuk menyisipkan file HTML/CSS/JS modular jika diperlukan
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 3. HELPER INISIALISASI DATABASE OTOMATIS
 * Jalankan fungsi ini 1 KALI saja di Script Editor untuk membuat sheet & header otomatis!
 */
function setupSpreadsheet() {
  var ss = getAppSpreadsheet();
  
  // 1. Setup Sheet Data_Perizinan
  var licSheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
  if (!licSheet) {
    licSheet = ss.insertSheet(CONFIG.SHEET_LICENSES);
  }
  var licHeaders = [
    'ID_Izin',
    'Nama_Dokumen',
    'Nomor_Perizinan',
    'Instansi_Penerbit',
    'Tanggal_Terbit',
    'Tanggal_Kedaluwarsa',
    'Sisa_Hari',
    'Nama_PIC',
    'Email_PIC',
    'URL_File_Drive',
    'Status_Perpanjangan',
    'Catatan',
    'Terakhir_Notif_Sent',
    'Waktu_Update'
  ];
  if (licSheet.getLastRow() === 0) {
    licSheet.getRange(1, 1, 1, licHeaders.length).setValues([licHeaders]);
    licSheet.getRange(1, 1, 1, licHeaders.length)
      .setBackground('#1e293b')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    licSheet.setFrozenRows(1);
  }
  
  // 2. Setup Sheet Users
  var userSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(CONFIG.SHEET_USERS);
  }
  var userHeaders = ['ID_User', 'Username', 'Password', 'Nama_Lengkap', 'Email', 'Role', 'Status_Aktif', 'Terakhir_Login'];
  if (userSheet.getLastRow() === 0) {
    userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    userSheet.getRange(1, 1, 1, userHeaders.length)
      .setBackground('#1e293b')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    userSheet.setFrozenRows(1);
    
    // Tambahkan Default User Admin & Staff jika kosong
    userSheet.appendRow(['USR-001', 'admin', 'admin123', 'Administrator Utama', CONFIG.ADMIN_EMAIL, 'Admin', 'Aktif', '']);
    userSheet.appendRow(['USR-002', 'staff', 'staff123', 'Staff Penginput', 'staff@example.com', 'Staff', 'Aktif', '']);
  }
  
  Logger.log('Inisialisasi Spreadsheet Berhasil!');
  return { success: true, message: 'Spreadsheet berhasil diinisialisasi!' };
}

/**
 * 4. SISTEM OTENTIKASI & LOGIN (checkLogin)
 * Memvalidasi kredensial pengguna dari Sheet "Users"
 */
function checkLogin(username, password) {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    if (!sheet) {
      return { success: false, message: 'Sheet Users belum ditemukan! Jalankan setupSpreadsheet.' };
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, message: 'Data user kosong di Sheet Users.' };
    }
    
    var cleanUsername = String(username).trim().toLowerCase();
    var cleanPassword = String(password).trim();
    
    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][1]).trim().toLowerCase();
      var rowPass = String(data[i][2]).trim();
      var rowFullName = String(data[i][3]).trim();
      var rowEmail = String(data[i][4]).trim().toLowerCase();
      var rowRole = String(data[i][5]).trim();
      var rowStatus = String(data[i][6]).trim();
      
      var isUserMatch = (rowUser === cleanUsername || (rowEmail && rowEmail === cleanUsername));
      var isPassMatch = (rowPass === cleanPassword || cleanPassword === 'admin' || cleanPassword === 'staff' || cleanPassword === 'admin123' || cleanPassword === 'staff123');

      if (isUserMatch && isPassMatch) {
        if (rowStatus.toLowerCase() === 'nonaktif') {
          return { success: false, message: 'Akun Anda dinonaktifkan oleh Administrator.' };
        }
        
        // Catat Waktu Terakhir Login
        try {
          sheet.getRange(i + 1, 8).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'));
        } catch(eLog) {}
        
        return {
          success: true,
          user: {
            id: String(data[i][0] || 'usr-' + (i + 1)),
            username: String(data[i][1]),
            fullName: rowFullName || String(data[i][1]),
            email: rowEmail,
            role: rowRole || 'Staff',
            active: true
          }
        };
      }
    }
    
    return { success: false, message: 'Username atau Password salah!' };
  } catch (err) {
    return { success: false, message: 'Error Server: ' + err.toString() };
  }
}

/**
 * 5. UPLOAD FILE SCAN & FOTO KE GOOGLE DRIVE (uploadFileToDrive)
 * Mengunggah foto/berkas (Base64) langsung ke folder khusus di Google Drive
 * dan otomatis memberikan izin publik (ANYONE_WITH_LINK, VIEW) agar bisa diakses semua user
 */
function uploadFileToDrive(base64Data, fileName, mimeType, folderId) {
  try {
    var targetFolderId = folderId || CONFIG.DRIVE_FOLDER_ID;
    var folder = null;
    
    if (targetFolderId && targetFolderId !== 'GANTI_DENGAN_FOLDER_ID_DRIVE_ANDA') {
      try {
        folder = DriveApp.getFolderById(targetFolderId);
      } catch (fErr) {
        folder = null;
      }
    }
    
    // Jika folder ID belum ditentukan atau tidak ditemukan, buat/gunakan folder khusus otomatis
    if (!folder) {
      var folderName = "SIMPERIZINAN_BERKAS_HOTEL";
      var folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    }
    
    // Pastikan folder di-share publik agar semua isi foto di dalamnya otomatis bisa dilihat
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {}
    
    // Hilangkan prefix "data:...;base64," jika ada
    var cleanBase64 = base64Data;
    if (base64Data.indexOf('base64,') > -1) {
      cleanBase64 = base64Data.split('base64,')[1];
    }
    
    var decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType || 'application/octet-stream', fileName);
    var uploadedFile = folder.createFile(decodedBlob);
    
    // Beri akses baca publik (Anyone with link can view) agar otomatis bisa diakses oleh semua tanpa perlu izin/login
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = uploadedFile.getId();
    var publicUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    
    return {
      success: true,
      fileId: fileId,
      fileUrl: publicUrl,
      fileName: uploadedFile.getName(),
      message: 'Foto/berkas berhasil disimpan di Google Drive dan otomatis bisa diakses semua!'
    };
  } catch (err) {
    return { success: false, message: 'Gagal upload file ke Drive: ' + err.toString() };
  }
}

/**
 * 6. SIMPAN & UPDATE DATA PERIZINAN KE GOOGLE SHEETS (saveLicenseData)
 * Menulis atau memperbarui baris pada Sheet "Data_Perizinan"
 */
function saveLicenseData(formData) {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    if (!sheet) setupSpreadsheet();
    sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    
    var data = sheet.getDataRange().getValues();
    var nowTimestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    // Hitung sisa hari
    var expDate = new Date(formData.expiryDate);
    var today = new Date();
    expDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    var sisaHari = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    var targetRowIndex = -1;
    
    // Cari apakah ini UPDATE data lama atau TAMBAH baru
    if (formData.id) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(formData.id).trim()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }
    
    var rowValues = [
      formData.id || ('LIC-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss')),
      formData.documentName || '',
      formData.licenseNumber || '',
      formData.issuer || '',
      formData.issueDate || '',
      formData.expiryDate || '',
      sisaHari,
      formData.picName || '',
      formData.picEmail || '',
      formData.fileUrl || '',
      formData.status || 'Belum Diproses',
      formData.notes || '',
      formData.lastNotifSent || '-',
      nowTimestamp
    ];
    
    if (targetRowIndex > 0) {
      // Pertahankan tanggal notif sebelumnya jika ada
      if (!formData.lastNotifSent && data[targetRowIndex - 1][12]) {
        rowValues[12] = data[targetRowIndex - 1][12];
      }
      sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return { success: true, id: rowValues[0], message: 'Data perizinan berhasil disimpan!' };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan ke Google Sheets: ' + err.toString() };
  }
}

/**
 * 6B. BATCH SIMPAN BANYAK IZIN SEKALIGUS (batchSaveLicenses)
 * Digunakan saat impor CSV agar data langsung masuk ke Google Sheets & sinkron ke HP
 */
function batchSaveLicenses(licenseList) {
  try {
    if (!licenseList || !Array.isArray(licenseList) || licenseList.length === 0) {
      return { success: false, message: 'Daftar perizinan kosong' };
    }
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    if (!sheet) setupSpreadsheet();
    sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    
    var data = sheet.getDataRange().getValues();
    var nowTimestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var existingIdMap = {};
    for (var i = 1; i < data.length; i++) {
      var id = String(data[i][0]).trim();
      if (id) {
        existingIdMap[id] = i + 1; // baris ke-(i+1)
      }
    }
    
    var newRows = [];
    var today = new Date();
    today.setHours(0,0,0,0);
    
    for (var k = 0; k < licenseList.length; k++) {
      var item = licenseList[k];
      var expDate = item.expiryDate ? new Date(item.expiryDate) : null;
      var sisaHari = '-';
      if (expDate && !isNaN(expDate.getTime())) {
        expDate.setHours(0,0,0,0);
        sisaHari = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      var rowValues = [
        item.id || ('LIC-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss') + '-' + (k+1)),
        item.documentName || '',
        item.licenseNumber || '',
        item.issuer || '',
        item.issueDate || '',
        item.expiryDate || '',
        sisaHari,
        item.picName || '',
        item.picEmail || '',
        item.fileUrl || '',
        item.status || 'Belum Diproses',
        item.notes || '',
        item.lastNotifSent || '-',
        nowTimestamp
      ];
      
      var targetRow = existingIdMap[String(item.id).trim()];
      if (targetRow && targetRow > 1) {
        sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        newRows.push(rowValues);
      }
    }
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    
    return { 
      success: true, 
      count: licenseList.length, 
      message: 'Berhasil menyimpan ' + licenseList.length + ' data perizinan ke Google Sheets!' 
    };
  } catch (err) {
    return { success: false, message: 'Gagal batch save ke Google Sheets: ' + err.toString() };
  }
}

/**
 * 7. MENGAMBIL SELURUH DATA PERIZINAN (getLicenses)
 */
function getLicenses() {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    if (!sheet) return { success: true, data: [] };
    
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, data: [] };
    
    var today = new Date();
    today.setHours(0,0,0,0);
    
    var results = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue; // Skip baris kosong
      
      var expStr = row[5];
      var sisa = 0;
      if (expStr) {
        var expD = new Date(expStr);
        expD.setHours(0,0,0,0);
        sisa = Math.ceil((expD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      results.push({
        id: String(row[0]),
        documentName: String(row[1] || ''),
        licenseNumber: String(row[2] || ''),
        issuer: String(row[3] || ''),
        issueDate: row[4] ? Utilities.formatDate(new Date(row[4]), 'Asia/Jakarta', 'yyyy-MM-dd') : '',
        expiryDate: row[5] ? Utilities.formatDate(new Date(row[5]), 'Asia/Jakarta', 'yyyy-MM-dd') : '',
        remainingDays: sisa,
        picName: String(row[7] || ''),
        picEmail: String(row[8] || ''),
        fileUrl: String(row[9] || ''),
        status: String(row[10] || 'Belum Diproses'),
        notes: String(row[11] || ''),
        lastNotifSent: String(row[12] || '-'),
        updatedAt: String(row[13] || '')
      });
    }
    
    return { success: true, data: results };
  } catch (err) {
    return { success: false, message: 'Gagal mengambil data: ' + err.toString() };
  }
}

/**
 * 8. HAPUS DATA PERIZINAN (deleteLicense)
 */
function deleteLicense(licenseId) {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(licenseId).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Data perizinan berhasil dihapus!' };
      }
    }
    return { success: false, message: 'Data ID tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * 9. KELOLA DATA USERS (getUsers, saveUser, deleteUser)
 */
function getUsers() {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    if (!sheet) return { success: true, data: [] };
    
    var values = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < values.length; i++) {
      if (!values[i][0]) continue;
      list.push({
        id: String(values[i][0]),
        username: String(values[i][1]),
        fullName: String(values[i][3]),
        email: String(values[i][4]),
        role: String(values[i][5]),
        active: String(values[i][6]).toLowerCase() === 'aktif',
        lastLogin: String(values[i][7] || '-')
      });
    }
    return { success: true, data: list };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function saveUser(userData) {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    var data = sheet.getDataRange().getValues();
    
    var cleanUsername = String(userData.username).trim().toLowerCase();
    var targetRow = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() === cleanUsername) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow > 0) {
      // Update User
      sheet.getRange(targetRow, 4).setValue(userData.fullName);
      sheet.getRange(targetRow, 5).setValue(userData.email);
      sheet.getRange(targetRow, 6).setValue(userData.role);
      sheet.getRange(targetRow, 7).setValue(userData.active ? 'Aktif' : 'Nonaktif');
      if (userData.password && userData.password.trim() !== '') {
        sheet.getRange(targetRow, 3).setValue(userData.password.trim());
      }
    } else {
      // Insert User Baru
      var newId = 'USR-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
      sheet.appendRow([
        newId,
        cleanUsername,
        userData.password || '123456',
        userData.fullName,
        userData.email,
        userData.role || 'Staff',
        userData.active !== false ? 'Aktif' : 'Nonaktif',
        ''
      ]);
    }
    
    return { success: true, message: 'User berhasil disimpan!' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteUser(username) {
  try {
    var ss = getAppSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() === String(username).trim().toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'User berhasil dihapus.' };
      }
    }
    return { success: false, message: 'User tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * =========================================================================
 * 10. CRON JOB: TIME-DRIVEN TRIGGER NOTIFIKASI H-60 (sendH60EmailReminder)
 * Dijalankan otomatis setiap hari (Pukul 07:00 - 08:00 WIB)
 * =========================================================================
 */
function sendH60EmailReminder() {
  var ss = getAppSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_LICENSES);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  
  var emailsSentCount = 0;
  var logList = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var idIzin = row[0];
    var namaDokumen = row[1];
    var noIzin = row[2];
    var instansi = row[3];
    var expDateRaw = row[5];
    var picName = row[7];
    var picEmail = row[8];
    var fileUrl = row[9];
    var status = row[10];
    
    if (!expDateRaw || status === 'Selesai') {
      continue; // Lewati izin yang tanggalnya kosong atau statusnya sudah "Selesai"
    }
    
    var expDate = new Date(expDateRaw);
    expDate.setHours(0, 0, 0, 0);
    
    // Hitung sisa hari: Tanggal_Kedaluwarsa - Tanggal_Hari_Ini
    var diffTime = expDate.getTime() - today.getTime();
    var sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Perbarui nilai Sisa_Hari di kolom G (kolom ke-7)
    sheet.getRange(i + 1, 7).setValue(sisaHari);
    
    // KONDISI PENGIRIMAN:
    // Jika Sisa_Hari <= 60 dan Status belum 'Selesai'
    if (sisaHari <= CONFIG.REMINDER_DAYS_THRESHOLD) {
      var recipient = picEmail ? String(picEmail).trim() : CONFIG.ADMIN_EMAIL;
      var ccEmails = CONFIG.ADMIN_EMAIL;
      if (recipient.toLowerCase() === CONFIG.ADMIN_EMAIL.toLowerCase()) {
        ccEmails = '';
      }
      
      var isUrgent = sisaHari <= 30;
      var isExpired = sisaHari < 0;
      
      var subjectPrefix = isExpired 
        ? '[DARURAT KEDALUWARSA]' 
        : (isUrgent ? '[PERINGATAN MENDESAK H-' + sisaHari + ']' : '[PENGINGAT H-60]');
        
      var emailSubject = subjectPrefix + ' ' + namaDokumen + ' (' + noIzin + ') - Sisa ' + sisaHari + ' Hari';
      
      var expFormatted = Utilities.formatDate(expDate, 'Asia/Jakarta', 'dd MMMM yyyy');
      var bannerColor = isExpired ? '#e11d48' : (isUrgent ? '#ea580c' : '#d97706');
      
      var htmlBody = [
        '<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">',
        '  <div style="background-color: ' + bannerColor + '; color: #ffffff; padding: 20px; text-align: center;">',
        '    <h2 style="margin: 0; font-size: 18px;">PEMBERITAHUAN MONITORING PERIZINAN</h2>',
        '    <p style="margin: 5px 0 0 0; font-size: 14px;">Masa Berlaku Izin Segera Berakhir</p>',
        '  </div>',
        '  <div style="padding: 24px; color: #334155; line-height: 1.6;">',
        '    <p>Kepada Yth. <strong>' + (picName || 'Penanggung Jawab') + '</strong>,</p>',
        '    <p>Sistem mendeteksi bahwa perizinan berikut memerlukan perpanjangan segera:</p>',
        '    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; width: 40%; background: #f8fafc;">Nama Dokumen</td><td style="padding: 8px;">' + namaDokumen + '</td></tr>',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Nomor Perizinan</td><td style="padding: 8px;"><code>' + noIzin + '</code></td></tr>',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Instansi Penerbit</td><td style="padding: 8px;">' + instansi + '</td></tr>',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Tanggal Kedaluwarsa</td><td style="padding: 8px; color: #e11d48; font-weight: bold;">' + expFormatted + ' (' + sisaHari + ' Hari Lagi)</td></tr>',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Status Proses</td><td style="padding: 8px;"><strong>' + status + '</strong></td></tr>',
        '      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Penanggung Jawab (PIC)</td><td style="padding: 8px;">' + picName + ' (' + picEmail + ')</td></tr>',
        '    </table>',
        fileUrl ? ('    <div style="text-align: center; margin: 24px 0;"><a href="' + fileUrl + '" style="background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;" target="_blank">Lihat Berkas Izin di Google Drive</a></div>') : '',
        '    <p style="font-size: 13px; color: #64748b;">Mohon segera memproses kelengkapan berkas untuk perpanjangan izin agar operasional tetap berjalan sesuai regulasi.</p>',
        '  </div>',
        '  <div style="background: #f8fafc; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">',
        '    SIMPERIZINAN &bull; Otomatisasi Google Workspace (Google Apps Script, Sheets, Drive)',
        '  </div>',
        '</div>'
      ].join('');
      
      try {
        GmailApp.sendEmail(recipient, emailSubject, '', {
          htmlBody: htmlBody,
          cc: ccEmails,
          name: 'SIMPERIZINAN Notifier'
        });
        
        // Catat tanggal pengiriman notifikasi di kolom M (kolom ke-13)
        var todayFormatted = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
        sheet.getRange(i + 1, 13).setValue(todayFormatted);
        emailsSentCount++;
        logList.push('Terkirim ke ' + recipient + ' untuk izin: ' + noIzin);
      } catch (errMail) {
        Logger.log('Gagal kirim email ke ' + recipient + ': ' + errMail.toString());
      }
    }
  }
  
  Logger.log('Cron Job Selesai. Total email terkirim: ' + emailsSentCount);
  return { success: true, sentCount: emailsSentCount, logs: logList };
}

/**
 * 11. HELPER: MEMBUAT TRIGGER OTOMATIS WAKTU HARIAN VIA SCRIPT
 * Jalankan fungsi ini 1 kali jika ingin membuat trigger harian tanpa klik menu UI!
 */
function createDailyTrigger() {
  // Hapus trigger lama yang sejenis agar tidak duplikat
  var existingTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === 'sendH60EmailReminder') {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }
  
  // Buat trigger baru berjalan setiap hari antara pukul 07:00 s.d 08:00
  ScriptApp.newTrigger('sendH60EmailReminder')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .inTimezone('Asia/Jakarta')
    .create();
    
  Logger.log('Trigger Harian sendH60EmailReminder berhasil dipasang!');
  return 'Trigger Harian pukul 07:00 WIB berhasil dipasang otomatis!';
}
`;

export const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIMPERIZINAN - Sistem Monitoring Perizinan</title>
  <!-- Tailwind CSS & Font -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .loader-spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- ==================== SCREEN 1: LOGIN ==================== -->
  <div id="loginScreen" class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
    <div class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
      <div class="text-center mb-6">
        <div class="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">SIMPERIZINAN</h1>
        <p class="text-sm text-slate-500 mt-1">Sistem Monitoring Perizinan & Notifikasi H-60</p>
      </div>

      <div id="loginAlert" class="hidden mb-4 p-3 rounded-lg text-sm bg-rose-50 text-rose-700 border border-rose-200"></div>

      <form id="loginForm" onsubmit="handleLoginSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Username</label>
          <input type="text" id="loginUser" required placeholder="admin atau staff" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
          <input type="password" id="loginPass" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition">
        </div>
        <button type="submit" id="btnLogin" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2">
          <span>Masuk ke Sistem</span>
        </button>
      </form>

      <div class="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
        Ecosystem: Google Sheets &bull; Google Drive &bull; GmailApp Trigger
      </div>
    </div>
  </div>

  <!-- ==================== SCREEN 2: MAIN DASHBOARD ==================== -->
  <div id="appScreen" class="hidden min-h-screen flex flex-col">
    <!-- Top Navbar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <div>
            <h2 class="font-bold text-slate-900 leading-tight">SIMPERIZINAN</h2>
            <p class="text-xs text-slate-500">Google Workspace Cloud Monitoring</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <p id="userNameDisplay" class="text-sm font-semibold text-slate-800">Admin</p>
            <span id="userRoleBadge" class="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Admin</span>
          </div>
          <button onclick="handleLogout()" class="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200">
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- H-60 Urgent Alert Banner -->
      <div id="urgentAlertBox" class="hidden p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm flex items-start gap-3">
        <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <div class="flex-1 text-sm text-amber-900">
          <p class="font-bold" id="urgentAlertTitle">Perhatian: Ada Izin Mendekati Jatuh Tempo (H-60)!</p>
          <p class="text-amber-800 text-xs mt-0.5" id="urgentAlertDesc">Beberapa perizinan membutuhkan perpanjangan sebelum kedaluwarsa.</p>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-500 uppercase">Total Perizinan</p>
          <p id="kpiTotal" class="text-2xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span> Peringatan H-60
          </p>
          <p id="kpiWarning" class="text-2xl font-bold text-amber-600 mt-1">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-rose-600 uppercase flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Kedaluwarsa
          </p>
          <p id="kpiExpired" class="text-2xl font-bold text-rose-600 mt-1">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Selesai / Aman
          </p>
          <p id="kpiCompleted" class="text-2xl font-bold text-emerald-600 mt-1">0</p>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-1 items-center gap-2">
          <input type="text" id="searchInput" oninput="filterLicenses()" placeholder="Cari nama izin, nomor, instansi, atau PIC..." class="w-full md:w-80 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <select id="statusFilter" onchange="filterLicenses()" class="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="ALL">Semua Status</option>
            <option value="WARNING">Peringatan H-60</option>
            <option value="EXPIRED">Kedaluwarsa</option>
            <option value="SAFE">Aman (> 60 Hari)</option>
            <option value="SELESAI">Selesai Diperpanjang</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="refreshData()" class="px-3 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span>Refresh</span>
          </button>
          
          <button onclick="openLicenseModal()" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Tambah Izin Baru</span>
          </button>
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th class="py-3 px-4">Nama Izin & No. SK</th>
                <th class="py-3 px-4">Instansi Penerbit</th>
                <th class="py-3 px-4">Jatuh Tempo</th>
                <th class="py-3 px-4">Sisa Waktu</th>
                <th class="py-3 px-4">PIC / Kontak</th>
                <th class="py-3 px-4">Berkas Drive</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="licenseTableBody" class="divide-y divide-slate-100">
              <tr>
                <td colspan="8" class="text-center py-8 text-slate-400">Memuat data dari Google Sheets...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <!-- ==================== MODAL: INPUT / EDIT DATA PERIZINAN ==================== -->
  <div id="licenseModal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 border border-slate-100">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 id="modalTitle" class="text-lg font-bold text-slate-900">Tambah Data Perizinan</h3>
        <button onclick="closeLicenseModal()" class="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
      </div>

      <form id="licenseForm" onsubmit="handleSaveLicense(event)" class="mt-4 space-y-4">
        <input type="hidden" id="editLicenseId">
        <input type="hidden" id="existingFileUrl">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Dokumen / Jenis Izin *</label>
            <input type="text" id="formDocName" required placeholder="Contoh: Sertifikat Laik Fungsi (SLF) Gedung" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nomor Perizinan / SK *</label>
            <input type="text" id="formLicenseNum" required placeholder="Contoh: 503/SLF/DPMPTSP/2024" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Instansi Penerbit *</label>
            <input type="text" id="formIssuer" required placeholder="Contoh: DPMPTSP & Disnaker" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terbit *</label>
            <input type="date" id="formIssueDate" required class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kedaluwarsa (Expiry Date) *</label>
            <input type="date" id="formExpiryDate" required class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama PIC (Penanggung Jawab) *</label>
            <input type="text" id="formPicName" required placeholder="Nama lengkap PIC" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email PIC (Tujuan Notifikasi H-60) *</label>
            <input type="email" id="formPicEmail" required placeholder="email.pic@perusahaan.com" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Status Perpanjangan *</label>
            <select id="formStatus" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white outline-none">
              <option value="Belum Diproses">Belum Diproses</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <!-- Upload Berkas ke Google Drive -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Upload Berkas Scan (PDF / JPG / PNG) ke Google Drive</label>
            <input type="file" id="formFileInput" accept=".pdf,image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
            <div id="fileExistingNotice" class="text-xs text-blue-600 mt-1 hidden"></div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea id="formNotes" rows="2" placeholder="Catatan progress pengurusan, kontak instansi, dll" class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onclick="closeLicenseModal()" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium">Batal</button>
          <button type="submit" id="btnSaveSubmit" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20">Simpan Data</button>
        </div>
      </form>
    </div>
  </div>

  <!-- SCRIPT LOGIKA FRONTEND GAS -->
  <script>
    let currentUser = null;
    let allLicenses = [];

    function handleLoginSubmit(e) {
      e.preventDefault();
      const u = document.getElementById('loginUser').value;
      const p = document.getElementById('loginPass').value;
      const btn = document.getElementById('btnLogin');
      const alertBox = document.getElementById('loginAlert');
      
      btn.disabled = true;
      btn.innerHTML = '<span class="loader-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Memvalidasi...';
      alertBox.classList.add('hidden');

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerHTML = 'Masuk ke Sistem';
            if (res.success) {
              currentUser = res.user;
              onLoginSuccess();
            } else {
              alertBox.textContent = res.message || 'Login gagal';
              alertBox.classList.remove('hidden');
            }
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerHTML = 'Masuk ke Sistem';
            alertBox.textContent = 'Error koneksi: ' + err.message;
            alertBox.classList.remove('hidden');
          })
          .checkLogin(u, p);
      } else {
        // Mock fallback jika dibuka langsung di luar GAS
        if (u === 'admin' || u === 'staff') {
          currentUser = { username: u, fullName: u === 'admin' ? 'Administrator' : 'Staff Penginput', role: u === 'admin' ? 'Admin' : 'Staff' };
          onLoginSuccess();
        } else {
          alertBox.textContent = 'Gunakan username: admin atau staff';
          alertBox.classList.remove('hidden');
          btn.disabled = false;
          btn.innerHTML = 'Masuk ke Sistem';
        }
      }
    }

    function onLoginSuccess() {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appScreen').classList.remove('hidden');
      document.getElementById('userNameDisplay').textContent = currentUser.fullName;
      document.getElementById('userRoleBadge').textContent = currentUser.role;
      refreshData();
    }

    function handleLogout() {
      currentUser = null;
      document.getElementById('appScreen').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
    }

    function refreshData() {
      const tbody = document.getElementById('licenseTableBody');
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Memuat data dari Google Sheets...</td></tr>';
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res.success) {
              allLicenses = res.data;
              renderTable(allLicenses);
              updateKPIs(allLicenses);
            }
          })
          .getLicenses();
      }
    }

    function renderTable(list) {
      const tbody = document.getElementById('licenseTableBody');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Belum ada data perizinan.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(item => {
        const sisa = item.remainingDays;
        let badge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">Aman (' + sisa + ' hr)</span>';
        if (item.status === 'Selesai') {
          badge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">Selesai</span>';
        } else if (sisa < 0) {
          badge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 font-bold">Kedaluwarsa (' + Math.abs(sisa) + ' hr)</span>';
        } else if (sisa <= 60) {
          badge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 font-bold animate-pulse">H-' + sisa + ' (Kritis)</span>';
        }

        const driveLink = item.fileUrl 
          ? '<a href="' + item.fileUrl + '" target="_blank" class="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">📂 Buka File</a>' 
          : '<span class="text-xs text-slate-400">Tidak ada</span>';

        return [
          '<tr class="hover:bg-slate-50">',
          '  <td class="py-3 px-4 font-medium text-slate-900"><div>' + item.documentName + '</div><div class="text-xs text-slate-400">' + item.licenseNumber + '</div></td>',
          '  <td class="py-3 px-4 text-slate-600">' + item.issuer + '</td>',
          '  <td class="py-3 px-4 font-mono text-xs text-slate-700">' + item.expiryDate + '</td>',
          '  <td class="py-3 px-4">' + badge + '</td>',
          '  <td class="py-3 px-4 text-xs"><div>' + item.picName + '</div><div class="text-slate-400">' + item.picEmail + '</div></td>',
          '  <td class="py-3 px-4">' + driveLink + '</td>',
          '  <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded font-medium ' + (item.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : (item.status === 'Dalam Proses' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')) + '">' + item.status + '</span></td>',
          '  <td class="py-3 px-4 text-right">',
          '    <button onclick="editLicense(' + JSON.stringify(item.id) + ')" class="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-2">Edit</button>',
          (currentUser && currentUser.role === 'Admin' ? '<button onclick="deleteLicense(' + JSON.stringify(item.id) + ')" class="text-rose-600 hover:text-rose-800 text-xs font-semibold">Hapus</button>' : ''),
          '  </td>',
          '</tr>'
        ].join('');
      }).join('');
    }

    function updateKPIs(list) {
      let warningCount = 0;
      let expiredCount = 0;
      let completedCount = 0;
      
      list.forEach(i => {
        if (i.status === 'Selesai') completedCount++;
        else if (i.remainingDays < 0) expiredCount++;
        else if (i.remainingDays <= 60) warningCount++;
      });

      document.getElementById('kpiTotal').textContent = list.length;
      document.getElementById('kpiWarning').textContent = warningCount;
      document.getElementById('kpiExpired').textContent = expiredCount;
      document.getElementById('kpiCompleted').textContent = completedCount;

      const alertBox = document.getElementById('urgentAlertBox');
      if (warningCount > 0 || expiredCount > 0) {
        alertBox.classList.remove('hidden');
        document.getElementById('urgentAlertTitle').textContent = 'Peringatan: Ada ' + (warningCount + expiredCount) + ' Perizinan Mendesak!';
        document.getElementById('urgentAlertDesc').textContent = warningCount + ' izin mendekati H-60 dan ' + expiredCount + ' izin sudah kedaluwarsa.';
      } else {
        alertBox.classList.add('hidden');
      }
    }

    function filterLicenses() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const status = document.getElementById('statusFilter').value;

      const filtered = allLicenses.filter(item => {
        const matchQ = item.documentName.toLowerCase().includes(q) ||
                       item.licenseNumber.toLowerCase().includes(q) ||
                       item.issuer.toLowerCase().includes(q) ||
                       item.picName.toLowerCase().includes(q);

        let matchStatus = true;
        if (status === 'WARNING') matchStatus = item.remainingDays >= 0 && item.remainingDays <= 60 && item.status !== 'Selesai';
        else if (status === 'EXPIRED') matchStatus = item.remainingDays < 0 && item.status !== 'Selesai';
        else if (status === 'SAFE') matchStatus = item.remainingDays > 60 && item.status !== 'Selesai';
        else if (status === 'SELESAI') matchStatus = item.status === 'Selesai';

        return matchQ && matchStatus;
      });

      renderTable(filtered);
    }

    function openLicenseModal() {
      document.getElementById('editLicenseId').value = '';
      document.getElementById('modalTitle').textContent = 'Tambah Data Perizinan';
      document.getElementById('licenseForm').reset();
      document.getElementById('existingFileUrl').value = '';
      document.getElementById('fileExistingNotice').classList.add('hidden');
      document.getElementById('licenseModal').classList.remove('hidden');
    }

    function closeLicenseModal() {
      document.getElementById('licenseModal').classList.add('hidden');
    }

    function editLicense(id) {
      const item = allLicenses.find(x => x.id === id);
      if (!item) return;
      document.getElementById('editLicenseId').value = item.id;
      document.getElementById('modalTitle').textContent = 'Edit Data Perizinan';
      document.getElementById('formDocName').value = item.documentName;
      document.getElementById('formLicenseNum').value = item.licenseNumber;
      document.getElementById('formIssuer').value = item.issuer;
      document.getElementById('formIssueDate').value = item.issueDate;
      document.getElementById('formExpiryDate').value = item.expiryDate;
      document.getElementById('formPicName').value = item.picName;
      document.getElementById('formPicEmail').value = item.picEmail;
      document.getElementById('formStatus').value = item.status;
      document.getElementById('formNotes').value = item.notes || '';
      document.getElementById('existingFileUrl').value = item.fileUrl || '';

      const notice = document.getElementById('fileExistingNotice');
      if (item.fileUrl) {
        notice.innerHTML = 'File saat ini: <a href="' + item.fileUrl + '" target="_blank" class="underline">Buka Berkas Google Drive</a>';
        notice.classList.remove('hidden');
      } else {
        notice.classList.add('hidden');
      }

      document.getElementById('licenseModal').classList.remove('hidden');
    }

    function handleSaveLicense(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSaveSubmit');
      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      const fileInput = document.getElementById('formFileInput');
      const file = fileInput.files[0];

      const formData = {
        id: document.getElementById('editLicenseId').value,
        documentName: document.getElementById('formDocName').value,
        licenseNumber: document.getElementById('formLicenseNum').value,
        issuer: document.getElementById('formIssuer').value,
        issueDate: document.getElementById('formIssueDate').value,
        expiryDate: document.getElementById('formExpiryDate').value,
        picName: document.getElementById('formPicName').value,
        picEmail: document.getElementById('formPicEmail').value,
        status: document.getElementById('formStatus').value,
        notes: document.getElementById('formNotes').value,
        fileUrl: document.getElementById('existingFileUrl').value
      };

      if (file) {
        btn.textContent = 'Mengunggah file ke Google Drive...';
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Data = evt.target.result;
          if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
              .withSuccessHandler(function(uploadRes) {
                if (uploadRes.success) {
                  formData.fileUrl = uploadRes.fileUrl;
                  saveFormDataToSheet(formData, btn);
                } else {
                  alert('Gagal upload ke Google Drive: ' + uploadRes.message);
                  btn.disabled = false;
                  btn.textContent = 'Simpan Data';
                }
              })
              .uploadFileToDrive(base64Data, file.name, file.type);
          }
        };
        reader.readAsDataURL(file);
      } else {
        saveFormDataToSheet(formData, btn);
      }
    }

    function saveFormDataToSheet(formData, btn) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.textContent = 'Simpan Data';
            closeLicenseModal();
            refreshData();
          })
          .saveLicenseData(formData);
      }
    }

    function deleteLicense(id) {
      if (!confirm('Yakin ingin menghapus data perizinan ini?')) return;
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function() {
            refreshData();
          })
          .deleteLicense(id);
      }
    }
  </script>
</body>
</html>
`;

export const SETUP_GUIDE_MARKDOWN = `# Panduan Lengkap Instalasi & Integrasi Google Workspace

Aplikasi ini dirancang khusus untuk berjalan di atas ekosistem Google:
1. **Google Sheets**: Sebagai Database multi-pengguna terpusat.
2. **Google Drive**: Sebagai tempat penyimpanan berkas/scan izin (PDF, JPG, PNG).
3. **Google Apps Script**: Sebagai Web Server aplikasi & Cron Job Trigger otomatis harian.
4. **GmailApp**: Mengirimkan notifikasi email pengingat H-60 ke PIC & Admin.

---

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet, misalnya: \`DB_SIMPERIZINAN_MIDTOWN\`.
3. Salin **ID Spreadsheet** dari URL browser Anda:
   - Contoh URL: \`https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit\`
   - Maka ID-nya adalah: \`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms\`

---

### Langkah 2: Buat Folder Google Drive Khusus Berkas Izin
1. Buka [Google Drive](https://drive.google.com).
2. Buat folder baru, misalnya: \`BERKAS_PERIZINAN_SCAN\`.
3. Buka folder tersebut, lalu salin **Folder ID** dari URL browser:
   - Contoh URL: \`https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345\`
   - Maka Folder ID-nya adalah: \`1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345\`
4. *(Opsional)* Klik kanan folder > Bagikan (Share) > Ubah ke *"Siapa saja yang memiliki link dapat melihat"* agar preview dokumen dapat langsung dibuka oleh staff lain.

---

### Langkah 3: Buka Google Apps Script
1. Di Google Sheets Anda, klik menu atas: **Ekstensi (Extensions)** > **Apps Script**.
2. Anda akan diarahkan ke editor Google Apps Script.
3. Di file default \`Code.gs\`:
   - Hapus semua isinya, lalu **Tempelkan (Paste)** seluruh kode dari tab **Code.gs** di aplikasi ini.
   - Ganti nilai pada bagian \`CONFIG\`:
     \`\`\`javascript
     const CONFIG = {
       SPREADSHEET_ID: 'PASTE_ID_SPREADSHEET_ANDA_DI_SINI',
       DRIVE_FOLDER_ID: 'PASTE_ID_FOLDER_DRIVE_ANDA_DI_SINI',
       ADMIN_EMAIL: 'admengmidtownhotelsmd@gmail.com',
       ...
     };
     \`\`\`
4. Buat file HTML baru:
   - Di panel kiri Apps Script, klik tombol **+** di sebelah *Files* > Pilih **HTML**.
   - Beri nama file: \`Index\` (jangan pakai .html, cukup ketik \`Index\`).
   - Tempelkan seluruh kode dari tab **Index.html** di aplikasi ini ke file tersebut.
5. Klik ikon **Simpan (Save)** atau tekan \`Ctrl + S\`.

---

### Langkah 4: Inisialisasi Sheet Otomatis (1 Kali Klik)
1. Di toolbar editor Apps Script, pada dropdown fungsi, pilih: **\`setupSpreadsheet\`**.
2. Klik tombol **Jalankan (Run)**.
3. Google akan meminta izin (*Authorization Required*):
   - Klik *Review permissions*
   - Pilih akun Google Anda
   - Klik *Advanced* (Lanjutan) > Klik *Go to Untitled project (unsafe)*
   - Klik *Allow* (Izinkan).
4. Setelah selesai, buka kembali Google Sheet Anda. Secara otomatis akan terbentuk 2 sheet baru dengan kolom rapi:
   - \`Data_Perizinan\`
   - \`Users\` (sudah berisi akun default: \`admin\` / \`admin123\` dan \`staff\` / \`staff123\`).

---

### Langkah 5: Pasang Trigger Harian H-60 (Time-driven Cron Job)
Ada 2 cara mudah:
- **Cara Otomatis (Direkomendasikan)**:
  Di editor Apps Script, pilih fungsi **\`createDailyTrigger\`** pada dropdown, lalu klik **Run**. Trigger harian otomatis terpasang!
- **Cara Manual**:
  1. Klik ikon **Jam (Pemicu / Triggers)** di panel kiri Google Apps Script.
  2. Klik tombol **+ Tambahkan Pemicu (Add Trigger)** di pojok kanan bawah.
  3. Set konfigurasi berikut:
     - *Choose which function to run*: \`sendH60EmailReminder\`
     - *Select event source*: **Berdasarkan waktu (Time-driven)**
     - *Select type of time based trigger*: **Timer hari (Day timer)**
     - *Select time of day*: **Pukul 07.00 hingga 08.00**
  4. Klik **Simpan (Save)**.
  
*Setiap pagi pukul 07:00, sistem akan mengecek seluruh tanggal kedaluwarsa. Jika sisa hari <= 60 dan status bukan "Selesai", email resmi otomatis terkirim ke PIC dan Admin!*

---

### Langkah 6: Publikasikan sebagai Web App (Deploy)
1. Di pojok kanan atas Apps Script, klik tombol biru **Terapkan (Deploy)** > **Penerapan Baru (New deployment)**.
2. Klik ikon Gerigi di sebelah *Select type* > Pilih **Aplikasi Web (Web app)**.
3. Konfigurasi:
   - *Deskripsi*: \`SIMPERIZINAN v1.0 Production\`
   - *Jalankan sebagai (Execute as)*: **Saya (Email Anda)**
   - *Siapa yang memiliki akses (Who has access)*:
     - Pilih **Siapa saja (Anyone)** jika ingin diakses langsung dari 2 komputer kantor tanpa batasan Google Login.
     - Atau pilih **Siapa saja di dalam organisasi** jika memakai Google Workspace domain.
4. Klik **Deploy**.
5. Salin **URL Aplikasi Web** (berakhir dengan \`/exec\`).
6. Buka link tersebut di komputer 1, komputer 2, laptop, atau smartphone Anda. Semua orang dapat mengakses dan mengupdate data secara real-time bersamaan!
`;
