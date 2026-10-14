// Client for the local Kasa bridge (bridge/kasa_bridge.py).
//
// The app always calls the bridge on its own origin under /api: in development
// Vite proxies /api to the bridge (see vite.config.js), and in production the
// bridge serves the built app itself. That keeps everything same-origin, so the
// bridge never has to allow cross-site requests.
const BASE = '/api';
const TOKEN_KEY = 'perry-bridge-token';

export class BridgeError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode); the token only lasts this session.
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (err) {
    throw new BridgeError(`Bridge unreachable: ${err.message}`, 0);
  }
  // A static host (or Vite with no bridge running) answers with HTML, not JSON.
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new BridgeError('No Kasa bridge is running', 0);
  }
  const data = await res.json();
  if (!res.ok) throw new BridgeError(data.error || res.statusText, res.status);
  return data;
}

export const health = () => request('/health');
export const getDevices = () => request('/devices');
export const discover = () => request('/discover', { method: 'POST', body: {} });
export const setDevice = (id, body) => request(`/devices/${encodeURIComponent(id)}`, { method: 'POST', body });
export const getMapping = () => request('/mapping');
export const putMapping = (mapping) => request('/mapping', { method: 'PUT', body: mapping });
