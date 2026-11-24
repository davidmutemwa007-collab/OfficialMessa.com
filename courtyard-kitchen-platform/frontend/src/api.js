const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function api(path, options = {}) {
  const token = localStorage.getItem('courtyard-token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  let response;
  try { response = await fetch(`${API_ROOT}${path}`, { ...options, headers }); }
  catch { throw new Error('The server could not be reached. Check that the API is running and VITE_API_URL points to it.'); }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && path !== '/api/auth/login') {
      localStorage.removeItem('courtyard-token'); localStorage.removeItem('courtyard-user');
      window.dispatchEvent(new Event('courtyard:session-expired'));
    }
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}
export const money = (amount, currency = 'ZMW') => new Intl.NumberFormat('en-ZM', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0));
export const asset = (path) => path && path.startsWith('/assets/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
export const imagePath = (path) => asset(path || '/assets/images/signature-spread.jpg');
