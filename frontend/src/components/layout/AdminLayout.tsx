import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { useState } from 'react';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Services', href: '/admin/services', icon: Package },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Admin</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:bg-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Back to App & Logout */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to App
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-error-400 hover:bg-gray-800 rounded-lg transition-colors"
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
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-lg font-semibold text-gray-900">
                PhoneNow Admin
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name}
              </span>
            </div>
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
