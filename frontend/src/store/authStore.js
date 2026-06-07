import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services';

const normalizeRole = (roleValue) => String(roleValue || '').toUpperCase();

const canAccessAdmin = (roleValue) => {
    const normalizedRole = normalizeRole(roleValue);
    return (
        normalizedRole === 'ADMIN' ||
        normalizedRole === 'SUPER_ADMIN' ||
        normalizedRole === 'SUPERADMIN' ||
        normalizedRole === 'ROLE_ADMIN' ||
        normalizedRole === 'ROLE_SUPER_ADMIN' ||
        normalizedRole === 'ROLE_SUPERADMIN'
    );
};

const readRoleFromAccessToken = () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token || !token.includes('.')) return '';

        const payloadPart = token.split('.')[1];
        if (!payloadPart) return '';

        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decodedPayload = atob(paddedBase64);
        const payload = JSON.parse(decodedPayload);

        return payload?.role || payload?.authorities?.[0] || '';
    } catch (_) {
        return '';
    }
};

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            // ── Login ───────────────────────────────────────────────────────────────
            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const res = await authService.login(credentials);
                    const { accessToken, refreshToken, ...user } = res.data?.data || {};
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
                    return res;
                } catch (err) {
                    set({ isLoading: false });
                    throw err;
                }
            },

            // ── Register ────────────────────────────────────────────────────────────
            register: async (data) => {
                set({ isLoading: true });
                try {
                    const res = await authService.register(data);
                    const { accessToken, refreshToken, ...user } = res.data?.data || {};
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
                    return res;
                } catch (err) {
                    set({ isLoading: false });
                    throw err;
                }
            },

            // ── Logout ──────────────────────────────────────────────────────────────
            logout: async () => {
                try { await authService.logout(); } catch (_) {}
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },

            // ── Set Auth (For OAuth2 Redirect) ───────────────────────────────────────
            setAuth: (accessToken, refreshToken, user) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
            },

            // ── Update profile ───────────────────────────────────────────────────────
            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),

            // ── Check if admin ───────────────────────────────────────────────────────
            isAdmin: () => {
                const { user } = get();
                if (canAccessAdmin(user?.role)) return true;
                const tokenRole = readRoleFromAccessToken();
                return canAccessAdmin(tokenRole);
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
