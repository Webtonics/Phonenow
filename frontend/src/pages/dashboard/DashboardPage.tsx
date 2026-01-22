import { Link } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';
import {
  Wallet,
  Phone,
  Share2,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      name: 'Buy Phone Number',
      description: 'Get instant verification codes',
      icon: Phone,
      href: '/phone-numbers',
      color: 'bg-primary-500',
    },
    {
      name: 'SMM Services',
      description: 'Grow your social presence',
      icon: Share2,
      href: '/smm-services',
      color: 'bg-secondary-500',
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
              <p className="text-2xl font-bold text-gray-900">₦0</p>
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
              <p className="text-2xl font-bold text-gray-900">0</p>
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
              <p className="text-2xl font-bold text-gray-900">0</p>
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
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No orders yet</p>
          <p className="text-sm">Your recent orders will appear here</p>
        </div>
      </div>
    </div>
  );
};
