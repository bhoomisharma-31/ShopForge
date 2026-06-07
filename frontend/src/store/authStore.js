import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('sf_user') || 'null'),
  token: localStorage.getItem('sf_token') || null,

  get isAuthenticated() {
    return !!get().token;
  },
  get isAdmin() {
    return get().user?.role === 'admin';
  },

  setAuth(user, token) {
    localStorage.setItem('sf_user', JSON.stringify(user));
    localStorage.setItem('sf_token', token);
    api.setAccessToken(token);
    set({ user, token });
  },

  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
        credentials: 'include',
      },
    ).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
      }
      return res.json();
    });

    get().setAuth(data.user, data.access_token);
    toast.success('Welcome back!');
    return data;
  },

  async register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    get().setAuth(data.user, data.access_token);
    toast.success('Account created!');
    return data;
  },

  logout() {
    localStorage.removeItem('sf_user');
    localStorage.removeItem('sf_token');
    api.setAccessToken(null);
    set({ user: null, token: null });
    toast.success('Logged out');
  },

  // Restore token into api client on app init
  hydrate() {
    const token = get().token;
    if (token) api.setAccessToken(token);
  },
}));

// Hydrate on module load
useAuthStore.getState().hydrate();

// Global 401 handler
api.setOnUnauthorized(() => {
  useAuthStore.getState().logout();
});

export default useAuthStore;
