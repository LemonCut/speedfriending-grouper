const PIN_KEY = 'sfg-admin-pin';

export const getPin = () => sessionStorage.getItem(PIN_KEY) || '';
export const setPin = (pin) => sessionStorage.setItem(PIN_KEY, pin);
export const clearPin = () => sessionStorage.removeItem(PIN_KEY);

async function request(path, { method = 'GET', body, pin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const p = pin ?? getPin();
  if (p) headers['x-admin-pin'] = p;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  state: () => request('/api/state'),
  joinInfo: () => request('/api/join-info'),
  register: (body) => request('/api/register', { method: 'POST', body }),
  verifyPin: (pin) => request('/api/admin/verify', { method: 'POST', pin }),
  lock: () => request('/api/admin/lock', { method: 'POST' }),
  unlock: () => request('/api/admin/unlock', { method: 'POST' }),
};
