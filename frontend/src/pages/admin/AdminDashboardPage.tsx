import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminService } from '@/services';
import { Order, Transaction } from '@/types';

interface DashboardStats {
  users: {
    total: number;
    today: number;
    this_month: number;
    active: number;
  };
  deposits: {
    total: number;
    today: number;
    this_month: number;
  };
  orders: {
    total: number;
    today: number;
    this_month: number;
    pending: number;
  };
  revenue: {
    total: number;
    today: number;
    this_month: number;
  };
  recent_transactions: Transaction[];
  recent_orders: Order[];
}

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboard();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.users.total || 0,
      subValue: `${stats?.users.today || 0} today`,
      icon: Users,
      color: 'bg-primary-500',
      href: '/admin/users',
    },
    {
      name: 'Total Orders',
      value: stats?.orders.total || 0,
      subValue: `${stats?.orders.pending || 0} pending`,
      icon: ShoppingCart,
      color: 'bg-secondary-500',
      href: '/admin/orders',
    },
    {
      name: 'Total Revenue',
      value: `₦${(stats?.revenue.total || 0).toLocaleString()}`,
      subValue: `₦${(stats?.revenue.today || 0).toLocaleString()} today`,
      icon: TrendingUp,
      color: 'bg-accent-500',
      href: '/admin/orders',
    },
    {
      name: 'Total Deposits',
      value: `₦${(stats?.deposits.total || 0).toLocaleString()}`,
      subValue: `₦${(stats?.deposits.today || 0).toLocaleString()} today`,
      icon: CreditCard,
      color: 'bg-green-500',
      href: '/admin/users',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subValue}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ArrowUpRight className="w-3 h-3 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.name || 'Unknown user'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">
                      ₦{order.amount_paid.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No orders yet</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              to="/admin/users"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600 rotate-180'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.user?.name || 'Unknown user'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">New Users</p>
            <p className="text-xl font-bold text-gray-900">{stats?.users.this_month || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-xl font-bold text-gray-900">{stats?.orders.this_month || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-xl font-bold text-gray-900">₦{(stats?.revenue.this_month || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Deposits</p>
            <p className="text-xl font-bold text-gray-900">₦{(stats?.deposits.this_month || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
