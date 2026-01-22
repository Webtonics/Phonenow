import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Phone,
  Share2,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Phone Numbers', href: '/phone-numbers', icon: Phone },
  { name: 'SMM Services', href: '/smm-services', icon: Share2 },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Profile', href: '/profile', icon: User },
];

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PhoneNow</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Balance Card */}
          <div className="p-4">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Balance</p>
              <p className="text-2xl font-bold">
                ₦{user?.balance?.toLocaleString() || '0.00'}
              </p>
              <Link
                to="/wallet"
                className="mt-2 inline-block text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 transition-colors"
              >
                Add Funds
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Link */}
            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Shield className="w-5 h-5 mr-3" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:hidden text-center">
              <span className="text-lg font-semibold text-gray-900">PhoneNow</span>
            </div>
            <div className="lg:hidden w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
