// ── Debounce ──────────────────────────────────────────────────────────────────
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Currency ──────────────────────────────────────────────────────────────────
export const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR',
      maximumFractionDigits: 0 }).format(amount || 0);

export const formatINRShort = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

// ── Dates ─────────────────────────────────────────────────────────────────────
export const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN',
        { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateRange = (start, end) =>
    `${formatDate(start)} → ${formatDate(end)}`;

export const daysBetween = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const todayISO = () => new Date().toISOString().split('T')[0];

// ── String ────────────────────────────────────────────────────────────────────
export const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str, n = 80) =>
    str && str.length > n ? str.slice(0, n) + '…' : str;

export const capitalize = (str = '') =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const getPrimaryImageUrl = (item = {}) => {
  const direct = [
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.imageUrl,
    item.image,
    item.photoUrl,
  ].find(url => typeof url === 'string' && url.trim());

  if (direct) return direct.trim();

  return (item.destinations || [])
      .flatMap(destination => Array.isArray(destination.imageUrls) ? destination.imageUrls : [])
      .find(url => typeof url === 'string' && url.trim())
      ?.trim();
};

// ── Color maps ────────────────────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  ADVENTURE: '#ff6584', RELAXATION: '#43e97b', LUXURY: '#f9c74f',
  BUDGET: '#6c63ff',   TREKKING: '#00d2ff',   FAMILY: '#ff9f7f',
  BACKPACKING: '#a78bfa',
};

export const STATUS_COLORS = {
  PLANNING: '#6c63ff', ONGOING: '#43e97b',
  COMPLETED: '#9898b3', CANCELLED: '#ff6b6b',
  CONFIRMED: '#43e97b', PENDING: '#f9c74f',
  FAILED: '#ff6b6b',   SUCCESS: '#43e97b',
};

export const EXPENSE_ICONS = {
  FOOD: '🍔', HOTEL: '🏨', TRANSPORT: '🚌',
  SHOPPING: '🛍️', ACTIVITY: '🎯', MISCELLANEOUS: '📦',
};

// ── Validation ────────────────────────────────────────────────────────────────
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
export const EMAIL_PATTERN    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Local storage ─────────────────────────────────────────────────────────────
export const storage = {
  get:    (key)        => { try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; } },
  set:    (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key)        => localStorage.removeItem(key),
  clear:  ()           => localStorage.clear(),
};
