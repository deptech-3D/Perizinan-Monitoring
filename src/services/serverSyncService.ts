import { LicenseItem, UserAccount } from '../types';

export async function fetchServerLicenses(): Promise<LicenseItem[] | null> {
  try {
    const res = await fetch('/api/licenses');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('Could not fetch server licenses:', err);
    return null;
  }
}

export async function saveServerLicenses(licenses: LicenseItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenses })
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save server licenses:', err);
    return false;
  }
}

export async function deleteServerLicense(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/licenses/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not delete server license:', err);
    return false;
  }
}

export async function fetchServerUsers(): Promise<UserAccount[] | null> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('Could not fetch server users:', err);
    return null;
  }
}

export async function saveServerUsers(users: UserAccount[]): Promise<boolean> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users })
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save server users:', err);
    return false;
  }
}

export async function fetchServerConfig(): Promise<{ webAppUrl: string; spreadsheetUrl?: string; driveFolderId: string } | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? { 
      webAppUrl: json.webAppUrl || '', 
      spreadsheetUrl: json.spreadsheetUrl || '',
      driveFolderId: json.driveFolderId || '' 
    } : null;
  } catch {
    return null;
  }
}

export async function saveServerConfig(webAppUrl?: string, driveFolderId?: string, spreadsheetUrl?: string): Promise<boolean> {
  try {
    const payload: any = {};
    if (webAppUrl !== undefined) payload.webAppUrl = webAppUrl;
    if (driveFolderId !== undefined) payload.driveFolderId = driveFolderId;
    if (spreadsheetUrl !== undefined) payload.spreadsheetUrl = spreadsheetUrl;

    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadFileToServer(
  fileName: string, 
  base64Data: string
): Promise<{ success: boolean; fileUrl: string; fileName: string } | null> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, base64Data })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}
