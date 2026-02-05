import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/stores/AuthContext';

// Layout components
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Public pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { VerifyEmailPendingPage } from '@/pages/auth/VerifyEmailPendingPage';

// Protected pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { WalletPage } from '@/pages/dashboard/WalletPage';
import { WalletSuccessPage } from '@/pages/dashboard/WalletSuccessPage';
import { PhoneNumbersPage } from '@/pages/dashboard/PhoneNumbersPage';
import { OrdersPage } from '@/pages/dashboard/OrdersPage';
import { OrderDetailPage } from '@/pages/dashboard/OrderDetailPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { ESIMPackagesPage } from '@/pages/dashboard/ESIMPackagesPage';
import { ESIMPurchasePage } from '@/pages/dashboard/ESIMPurchasePage';
import { MyESIMsPage } from '@/pages/dashboard/MyESIMsPage';
import { ESIMProfileDetailPage } from '@/pages/dashboard/ESIMProfileDetailPage';
import { ReferralsPage } from '@/pages/dashboard/ReferralsPage';
import { ReferralsListPage } from '@/pages/dashboard/ReferralsListPage';
import { CommissionsPage } from '@/pages/dashboard/CommissionsPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminESIMPage } from '@/pages/admin/AdminESIMPage';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Guest Route wrapper (redirect if already logged in)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes (guest only) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/success" element={<WalletSuccessPage />} />
        <Route path="/phone-numbers" element={<PhoneNumbersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/esim/packages" element={<ESIMPackagesPage />} />
        <Route path="/esim/purchase/:id" element={<ESIMPurchasePage />} />
        <Route path="/esim/my-profiles" element={<MyESIMsPage />} />
        <Route path="/esim/profile/:id" element={<ESIMProfileDetailPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/referrals/list" element={<ReferralsListPage />} />
        <Route path="/referrals/commissions" element={<CommissionsPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route path="/admin/esim" element={<AdminESIMPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


// Network components
import { NetworkProvider } from '@/stores/NetworkContext';
import { OfflineBanner } from '@/components/common/OfflineBanner';

function App() {
  return (
    <NetworkProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <OfflineBanner />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </AuthProvider>
      </Router>
    </NetworkProvider>
  );
}

export default App;
