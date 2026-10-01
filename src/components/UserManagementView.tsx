import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Trash2, 
  Edit, 
  Key, 
  CheckCircle, 
  XCircle, 
  Lock,
  Mail,
  Shield,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface UserManagementViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [active, setActive] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showModalPassword, setShowModalPassword] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setShowModalPassword(false);
    setRole('Staff');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword(user.password || '');
    setShowModalPassword(false);
    setRole(user.role);
    setActive(user.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      onUpdateUser(editingUserId, {
        username,
        fullName,
        email,
        password: password || undefined,
        role,
        active
      });
    } else {
      onAddUser({
        username,
        fullName,
        email,
        password: password || '123456',
        role,
        active
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Manajemen Pengguna & Hak Akses (Role RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Seluruh data akun tersinkronisasi langsung dengan sheet <code>Users</code> di Google Spreadsheet. 
            Hanya role <strong>Admin</strong> yang memiliki otoritas untuk menambah, mengubah, atau menghapus hak akses.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Matrix Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Hak Akses Role: ADMIN</span>
          </div>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Melihat seluruh data perizinan, statistik & dashboard.</li>
            <li>Menambah, mengedit, dan <strong>menghapus data perizinan</strong>.</li>
            <li><strong>Mengelola akun user</strong> (tambah, edit role, nonaktifkan, hapus).</li>
            <li>Mengunduh laporan spreadsheet CSV/Excel.</li>
            <li>Memicu pengujian simulasi notifikasi H-60.</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2">
            <User className="w-4 h-4 text-slate-600" />
            <span>Hak Akses Role: PENGINPUT (STAFF)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            <li>Melihat daftar perizinan & status masa berlaku H-60.</li>
            <li>Menginput dan mengedit data perizinan baru.</li>
            <li>Mengunggah berkas scan (PDF/Foto) ke folder Google Drive.</li>
            <li><strong>Tidak dapat</strong> mengelola user lain atau menghapus perizinan sensitif.</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Daftar Akun Terdaftar ({users.length})</h3>
          <span className="text-xs text-slate-400">Sheet: Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-6">Pengguna</th>
                <th className="py-3 px-6">Username</th>
                <th className="py-3 px-6">Email Terdaftar</th>
                <th className="py-3 px-6">Password</th>
                <th className="py-3 px-6">Peran (Role)</th>
                <th className="py-3 px-6">Status Akun</th>
                <th className="py-3 px-6">Terakhir Login</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{u.fullName}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs text-slate-700">
                      <code>{u.username}</code>
                    </td>

                    <td className="py-3.5 px-6 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {revealedIds.has(u.id) ? (u.password || '123456') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal(u.id)}
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                          title={revealedIds.has(u.id) ? 'Sembunyikan password' : 'Lihat password'}
                        >
                          {revealedIds.has(u.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.role === 'Admin'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role === 'Admin' ? (
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                        ) : (
                          <User className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.active ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{u.active ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-xs text-slate-500 font-mono">
                      {u.lastLogin || '-'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus user @${u.username}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            title="Hapus User"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username (Untuk Login) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  placeholder="misal: budi.s"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Email Kantor *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@midtownhotel.co.id"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login {editingUserId ? '(Kosongkan jika tidak diubah)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required={!editingUserId}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUserId ? '••••••••' : 'Masukkan password baru'}
                    className="w-full pl-3.5 pr-10 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showModalPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran / Hak Akses (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Staff">Penginput (Staff) - Hanya Input & Edit Izin</option>
                  <option value="Admin">Admin - Hak Akses Penuh & Kelola Pengguna</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Akun Aktif (Bisa Login ke Sistem)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
