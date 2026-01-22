import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginForm, RegisterForm } from '@/types';
import { authService } from '@/services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = authService.getToken();

        if (storedUser && token) {
          // Verify token is still valid by fetching user
          const response = await authService.getUser();
          if (response.success && response.data.email_verified) {
            // Only set user as logged in if email is verified
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else if (response.success && !response.data.email_verified) {
            // User exists but email not verified - keep token for resend functionality
            // but don't set user as logged in
            localStorage.removeItem('user');
            localStorage.setItem('pending_user', JSON.stringify(response.data));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('pending_user');
          }
        }
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('pending_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginForm) => {
    const response = await authService.login(data);
    if (response.success) {
      if (response.data.user.email_verified) {
        setUser(response.data.user);
      } else {
        // User logged in but email not verified
        // Store as pending user for verification page
        localStorage.setItem('pending_user', JSON.stringify(response.data.user));
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
    }
  }, []);

  const register = useCallback(async (data: RegisterForm) => {
    await authService.register(data);
    // Registration doesn't log in the user - they need to verify email first
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('pending_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getUser();
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
