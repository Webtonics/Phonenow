import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';
import { authService } from '@/services';
import {
  Wallet,
  Phone,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
} from 'lucide-react';

interface DashboardStats {
  total_spent: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  recent_orders: Array<{
    id: number;
    order_number: string;
    type: string;
    status: string;
    amount_paid: number;
    product_name: string | null;
    phone_number: string | null;
    created_at: string;
  }>;
}

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authService.getDashboard();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      name: 'Buy Phone Number',
      description: 'Get instant verification codes',
      icon: Phone,
      href: '/phone-numbers',
      color: 'bg-primary-500',
    },
    {
      name: 'eSIM Packages',
      description: 'Get global connectivity',
      icon: Smartphone,
      href: '/esim/packages',
      color: 'bg-purple-500',
    },
    {
      name: 'Add Funds',
      description: 'Top up your wallet',
      icon: Wallet,
      href: '/wallet',
      color: 'bg-accent-500',
    },
    {
      name: 'View Orders',
      description: 'Check order status',
      icon: ShoppingCart,
      href: '/orders',
      color: 'bg-gray-700',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
      case 'expired':
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
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'esim':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
        );
      case 'phone_number':
      default:
        return (
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary-600" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="opacity-80">Ready to get verified?</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Current Balance</p>
            <p className="text-3xl font-bold">
              ₦{user?.balance?.toLocaleString() || '0.00'}
            </p>
          </div>
          <Link
            to="/wallet"
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            Add Funds
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="card hover:shadow-md transition-shadow group"
            >
              <div
                className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {action.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  ₦{stats?.total_spent?.toLocaleString() || '0'}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.active_orders || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-accent-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Orders</p>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.completed_orders || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-secondary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            to="/orders"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : stats?.recent_orders && stats.recent_orders.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getOrderTypeIcon(order.type)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {order.product_name || order.phone_number || order.order_number}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      {getStatusIcon(order.status)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    ₦{order.amount_paid.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No orders yet</p>
            <p className="text-sm">Your recent orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
