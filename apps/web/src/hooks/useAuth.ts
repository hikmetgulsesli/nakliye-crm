import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth.service';

export function useAuth() {
  const { user, accessToken, isAuthenticated, login, logout, isAdmin } =
    useAuthStore();
  const navigate = useNavigate();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const data = await authService.login({ email, password });
      login(data.user, data.accessToken);
      navigate('/');
    },
    [login, navigate],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const { user: freshUser } = await authService.getMe();
      useAuthStore.getState().setUser(freshUser);
    } catch {
      // If getMe fails, token might be expired
    }
  }, []);

  // Auto-refresh token before expiry (every 14 minutes for a 15-min token)
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const scheduleRefresh = () => {
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const data = await authService.refreshToken();
          useAuthStore.getState().setToken(data.accessToken);
          scheduleRefresh(); // Schedule next refresh
        } catch {
          logout();
        }
      }, 14 * 60 * 1000); // 14 minutes
    };

    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated, accessToken, logout]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
  };
}
