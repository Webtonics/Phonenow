import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Phone,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Wifi,
  Settings,
  Bell,
  ChevronRight,
  Plus,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Phone Numbers', href: '/phone-numbers', icon: Phone },
  { name: 'SMM Services', href: '/smm', icon: TrendingUp },
  { name: 'eSIM Packages', href: '/esim/packages', icon: Wifi },
  { name: 'My eSIMs', href: '/esim/my-profiles', icon: Wifi },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Referrals', href: '/referrals', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
];

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 w-[260px] bg-[var(--color-sidebar)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo & Close Button - Fixed Header */}
        <div
          className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-[var(--color-sidebar-border)]"
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-9 brightness-0 invert" />
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors text-[var(--color-sidebar-text-muted)] hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content - Profile, Balance, and Navigation */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar">
          {/* User Profile Section - Compact */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-primary-500"
              >
                {getInitials(user?.name || '')}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-sidebar-text-muted)]">
                  Welcome back,
                </p>
                <p className="text-white font-semibold text-sm truncate">
                  {user?.name || 'User'}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="px-4 py-3">
            <div
              className="rounded-xl p-4 bg-primary-500"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/80">Balance</span>
                <Wallet className="w-4 h-4 text-white/60" />
              </div>
              <p className="text-xl font-bold text-white mb-2">
                ₦{user?.balance?.toLocaleString() || '0.00'}
              </p>
              <Link
                to="/wallet"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-2 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Funds
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-2">
            <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-sidebar-text-muted)]">
              Menu
            </p>
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="sidebar-nav-item"
                    style={{
                      backgroundColor: isActive ? 'var(--color-primary-500)' : 'transparent',
                      color: isActive ? 'white' : 'var(--color-sidebar-text-muted)',
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                  </Link>
                );
              })}

              {/* Admin Link */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="sidebar-nav-item"
                  style={{
                    backgroundColor: location.pathname.startsWith('/admin') ? 'var(--color-primary-500)' : 'transparent',
                    color: location.pathname.startsWith('/admin') ? 'white' : 'var(--color-sidebar-text-muted)',
                  }}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Logout Button - Fixed Footer */}
        <div
          className="px-3 py-3 shrink-0 border-t border-[var(--color-sidebar-border)]"
        >
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-error-400 hover:text-error-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main content - Offset by sidebar width on desktop */}
      <div
        className="min-h-screen transition-all duration-300 lg:ml-[260px]"
      >
        {/* Desktop offset handled by parent margin */}
        <div className="hidden lg:block">
          {/* Top bar */}
          <header
            className="sticky top-0 z-30 h-16"
            style={{ backgroundColor: 'var(--color-page-bg)' }}
          >
            <div className="flex items-center justify-end h-full px-6">
              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button
                  className="p-2.5 rounded-xl relative transition-colors"
                  style={{
                    backgroundColor: 'var(--color-card-bg)',
                    color: 'var(--color-text-muted)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <Bell className="w-5 h-5" />
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--color-error-500)' }}
                  />
                </button>

                {/* Settings */}
                <Link
                  to="/profile"
                  className="p-2.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'var(--color-card-bg)',
                    color: 'var(--color-text-muted)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </header>

          {/* Page content - Desktop */}
          <main className="p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          {/* Mobile Top bar */}
          <header
            className="sticky top-0 z-30 h-16"
            style={{ backgroundColor: 'var(--color-page-bg)' }}
          >
            <div className="flex items-center justify-between h-full px-4">
              {/* Mobile menu button */}
              <button
                className="p-2 rounded-xl transition-colors"
                style={{
                  backgroundColor: 'var(--color-card-bg)',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-card)'
                }}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
              <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-8" />

              {/* User avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                {getInitials(user?.name || '')}
              </div>
            </div>
          </header>

          {/* Page content - Mobile */}
          <main className="p-4 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
