import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import { User } from '@/types';

// ── Create User Modal ────────────────────────────────────────────────────────
interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: User) => void;
}

const CreateUserModal = ({ onClose, onCreated }: CreateUserModalProps) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer' as User['role'],
    password: '',
    balance: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await adminService.createUser({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
        balance: form.balance ? parseFloat(form.balance) : undefined,
      });
      if (response.success) {
        toast.success('User created successfully');
        onCreated(response.data);
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    } catch {
      toast.error('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field w-full"
              placeholder="john@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field w-full"
              placeholder="+234..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field w-full"
              placeholder="Min. 8 characters"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}
              className="input-field w-full"
            >
              <option value="customer">Customer</option>
              <option value="reseller">Reseller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Balance (₦) <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="input-field w-full"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        per_page: 10,
        search: search || undefined,
        role: (roleFilter || undefined) as 'customer' | 'reseller' | 'admin' | undefined,
      });
      if (response.success) {
        setUsers(response.data);
        setTotalPages(response.meta.last_page);
        setTotal(response.meta.total);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await adminService.toggleUserStatus(userId);
      if (response.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ));
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-40"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="reseller">Reseller</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">User</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Balance</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Joined</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'reseller' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">₦{user.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          className={`flex items-center gap-1 text-sm ${
                            user.is_active ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {user.is_active ? (
                            <><ToggleRight className="w-5 h-5" /> Active</>
                          ) : (
                            <><ToggleLeft className="w-5 h-5" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'reseller' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Balance: <span className="font-medium text-gray-900">₦{user.balance.toLocaleString()}</span></span>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className={`flex items-center gap-1 ${user.is_active ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-400">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-primary-600 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline text-sm py-1.5 px-3 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline text-sm py-1.5 px-3 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
            setTotal((t) => t + 1);
            setCreateOpen(false);
          }}
        />
      )}
    </div>
  );
};
