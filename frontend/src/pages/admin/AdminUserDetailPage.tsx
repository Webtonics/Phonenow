import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Wallet,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import { User, Transaction, Order } from '@/types';

type UserWithRelations = User & {
  transactions: Transaction[];
  orders: Order[];
};

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  reseller: 'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-700',
};

const TXN_TYPE_COLORS: Record<string, string> = {
  credit: 'text-green-600',
  debit: 'text-red-600',
  deposit: 'text-green-600',
  withdrawal: 'text-red-600',
  purchase: 'text-orange-600',
  refund: 'text-blue-600',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

// ── Edit User Modal ──────────────────────────────────────────────────────────
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

const EditUserModal = ({ user, onClose, onSaved }: EditUserModalProps) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await adminService.updateUser(user.id, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
      });
      if (response.success) {
        toast.success('User updated');
        onSaved(response.data);
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
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
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field w-full"
              placeholder="Optional"
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Adjust Balance Modal ──────────────────────────────────────────────────────
interface AdjustBalanceModalProps {
  user: User;
  mode: 'add' | 'remove';
  onClose: () => void;
  onAdjusted: (newBalance: number) => void;
}

const AdjustBalanceModal = ({ user, mode, onClose, onAdjusted }: AdjustBalanceModalProps) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setSaving(true);
    try {
      const adjustedAmount = mode === 'remove' ? -num : num;
      const response = await adminService.adjustUserBalance(user.id, adjustedAmount, reason);
      if (response.success) {
        toast.success(`Balance ${mode === 'add' ? 'added' : 'removed'} successfully`);
        onAdjusted(response.data.new_balance);
      } else {
        toast.error(response.message || 'Adjustment failed');
      }
    } catch {
      toast.error('Failed to adjust balance');
    } finally {
      setSaving(false);
    }
  };

  const isAdd = mode === 'add';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdd ? 'Add Funds' : 'Remove Funds'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Current balance: <span className="font-semibold text-gray-900">₦{user.balance.toLocaleString()}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field w-full"
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field w-full h-20 resize-none"
              placeholder="Reason for adjustment..."
              required
            />
          </div>
          {amount && (
            <div className={`text-sm font-medium ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
              New balance: ₦{Math.max(0, user.balance + (isAdd ? 1 : -1) * (parseFloat(amount) || 0)).toLocaleString()}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition ${
                isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-60`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : isAdd ? 'Add Funds' : 'Remove Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'transactions' | 'orders'>('transactions');
  const [editOpen, setEditOpen] = useState(false);
  const [balanceModal, setBalanceModal] = useState<'add' | 'remove' | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const response = await adminService.getUser(Number(id));
        if (response.success) {
          setUser(response.data as UserWithRelations);
        } else {
          toast.error('User not found');
        }
      } catch {
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setTogglingStatus(true);
    try {
      const response = await adminService.toggleUserStatus(user.id);
      if (response.success) {
        setUser({ ...user, is_active: response.data.is_active });
        toast.success(response.data.is_active ? 'User activated' : 'User deactivated');
      }
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link to="/admin/users" className="btn-outline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          User not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/users" className="btn-outline p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">User #{user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: profile + balance */}
        <div className="space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Profile</h2>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xl font-bold text-primary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{user.email}</span>
                {user.email_verified ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{user.phone ?? <span className="text-gray-400 italic">No phone</span>}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              {user.last_login_at && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Last login {new Date(user.last_login_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Status toggle */}
            <div className="pt-3 border-t">
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`flex items-center gap-2 text-sm font-medium w-full justify-between px-3 py-2 rounded-lg transition ${
                  user.is_active
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                } disabled:opacity-60`}
              >
                <span>{user.is_active ? 'Account Active' : 'Account Inactive'}</span>
                {togglingStatus ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : user.is_active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Balance card */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900">Wallet Balance</h2>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₦{user.balance.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBalanceModal('add')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
              <button
                onClick={() => setBalanceModal('remove')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Minus className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>

          {/* User stats summary */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{user.transactions?.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Transactions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{user.orders?.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: transactions + orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setTab('transactions')}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  tab === 'transactions'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setTab('orders')}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  tab === 'orders'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
              </button>
            </div>

            {tab === 'transactions' && (
              <div>
                {!user.transactions?.length ? (
                  <div className="py-12 text-center text-gray-500 text-sm">No transactions yet</div>
                ) : (
                  <div className="divide-y">
                    {user.transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {txn.description ?? txn.type}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {txn.reference ?? '—'} · {new Date(txn.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className={`text-sm font-semibold ${TXN_TYPE_COLORS[txn.type] ?? 'text-gray-700'}`}>
                            {txn.type === 'debit' || txn.type === 'withdrawal' || txn.type === 'purchase' ? '-' : '+'}
                            ₦{Number(txn.amount).toLocaleString()}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div>
                {!user.orders?.length ? (
                  <div className="py-12 text-center text-gray-500 text-sm">No orders yet</div>
                ) : (
                  <div className="divide-y">
                    {user.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.type} · {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            ₦{Number(order.amount_paid).toLocaleString()}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <EditUserModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setUser({ ...user, ...updated });
            setEditOpen(false);
          }}
        />
      )}

      {/* Balance Modal */}
      {balanceModal && (
        <AdjustBalanceModal
          user={user}
          mode={balanceModal}
          onClose={() => setBalanceModal(null)}
          onAdjusted={(newBalance) => {
            setUser({ ...user, balance: newBalance });
            setBalanceModal(null);
          }}
        />
      )}
    </div>
  );
};
