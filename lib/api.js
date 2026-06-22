// Client-side API helper: stores session in localStorage, auto-refreshes on 401.
'use client';

export const Session = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  get user() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } },
  save({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

export async function apiFetch(path, { method = 'GET', body, auth = false, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Session.access) headers['Authorization'] = `Bearer ${Session.access}`;
  const res = await fetch('/api' + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth && !_retry && Session.refresh) {
    if (await tryRefresh()) return apiFetch(path, { method, body, auth, _retry: true });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: Session.refresh }),
    });
    if (!res.ok) { Session.clear(); return false; }
    Session.save(await res.json());
    return true;
  } catch { Session.clear(); return false; }
}

export const Auth = {
  register: (role, payload) => apiFetch(`/auth/register/${role}`, { method: 'POST', body: payload }),
  login: (phone, password) => apiFetch('/auth/login', { method: 'POST', body: { phone, password } }),
  me: () => apiFetch('/auth/me', { auth: true }),
  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken: Session.refresh } }).catch(() => {});
    Session.clear();
  },
};

export const DASHBOARD_BY_ROLE = {
  admin: '/admin/dashboard',
  manufacturer: '/manufacturer/dashboard',
  distributor: '/distributor/dashboard',
  farmer: '/farmer/dashboard',
};

// --- Feature API modules ---
export const Admin = {
  stakeholders: (role, { q, district_id, block_id } = {}) =>
    apiFetch('/admin/stakeholders/' + role + '?' + new URLSearchParams(
      Object.fromEntries(Object.entries({ q, district_id, block_id }).filter(([,v]) => v))).toString(), { auth: true }),
  getCommission: (orgId) => apiFetch('/admin/commission/' + orgId, { auth: true }),
  setCommission: (orgId, kind, value) => apiFetch('/admin/commission/' + orgId, { method: 'PUT', auth: true, body: { kind, value } }),
  setMerchantBuying: (userId, allow) => apiFetch('/admin/users/' + userId + '/merchant-buying', { method: 'POST', auth: true, body: { allow } }),
  earnings: ({ from, to, kind } = {}) => apiFetch('/admin/earnings?' + new URLSearchParams(
    Object.fromEntries(Object.entries({ from, to, kind }).filter(([,v]) => v))).toString(), { auth: true }),
};
export const Geo = {
  states: () => apiFetch('/geo/states', { auth: true }),
  districts: (sid) => apiFetch('/geo/districts' + (sid ? `?state_id=${sid}` : ''), { auth: true }),
  blocks: (did) => apiFetch('/geo/blocks' + (did ? `?district_id=${did}` : ''), { auth: true }),
};
export const Societies = {
  list: () => apiFetch('/societies'),
};
export const Manufacturer = {
  settings: (y) => apiFetch('/manufacturer/settings' + (y ? `?year=${y}` : ''), { auth: true }),
  saveCapacity: (year, capacity) => apiFetch('/manufacturer/capacity', { method: 'PUT', auth: true, body: { year, capacity } }),
  saveBlocks: (blockIds) => apiFetch('/manufacturer/blocks', { method: 'PUT', auth: true, body: { blockIds } }),
  saveSociety: (society_code, is_exclusive) => apiFetch('/manufacturer/settings', { method: 'PUT', auth: true, body: { society_code, is_exclusive } }),
};
export const Distributor = {
  settings: () => apiFetch('/distributor/settings', { auth: true }),
  saveBlocks: (blockIds) => apiFetch('/distributor/blocks', { method: 'PUT', auth: true, body: { blockIds } }),
  saveManufacturers: (manufacturerIds) => apiFetch('/distributor/manufacturers', { method: 'PUT', auth: true, body: { manufacturerIds } }),
  setProductPricing: (product_id, price, min_qty) => apiFetch('/distributor/product-pricing', { method: 'PUT', auth: true, body: { product_id, price, min_qty } }),
};
export const Farmer = {
  settings: () => apiFetch('/farmer/settings', { auth: true }),
  saveProfile: (full_name, email, address) => apiFetch('/farmer/profile', { method: 'PUT', auth: true, body: { full_name, email, address } }),
  saveBlock: (block_id) => apiFetch('/farmer/block', { method: 'PUT', auth: true, body: { block_id } }),
};
export const Products = {
  mine: () => apiFetch('/products/mine', { auth: true }),
  create: (p) => apiFetch('/products', { method: 'POST', auth: true, body: p }),
  update: (id, p) => apiFetch('/products/' + id, { method: 'PUT', auth: true, body: p }),
  remove: (id) => apiFetch('/products/' + id, { method: 'DELETE', auth: true }),
  pricing: (id) => apiFetch('/products/' + id + '/pricing', { auth: true }),
  savePricing: (id, prices) => apiFetch('/products/' + id + '/pricing', { method: 'PUT', auth: true, body: { prices } }),
  available: () => apiFetch('/products/available', { auth: true }),
};
export const Catalog = {
  search: (q, category) => apiFetch('/catalog?' + new URLSearchParams(Object.fromEntries(Object.entries({ q, category }).filter(([,v]) => v))).toString(), { auth: true }),
  request: (item) => apiFetch('/catalog/request', { method: 'POST', auth: true, body: item }),
  all: (status) => apiFetch('/catalog/admin/all' + (status ? `?status=${status}` : ''), { auth: true }),
  create: (item) => apiFetch('/catalog/admin', { method: 'POST', auth: true, body: item }),
  update: (id, item) => apiFetch('/catalog/admin/' + id, { method: 'PUT', auth: true, body: item }),
  approve: (id) => apiFetch('/catalog/admin/' + id + '/approve', { method: 'POST', auth: true }),
  reject: (id) => apiFetch('/catalog/admin/' + id + '/reject', { method: 'POST', auth: true }),
  remove: (id) => apiFetch('/catalog/admin/' + id, { method: 'DELETE', auth: true }),
};
export const Orders = {
  farmerShop: (districtId) => apiFetch('/orders/farmer/shop' + (districtId ? `?district_id=${districtId}` : ''), { auth: true }),
  farmerDistributors: () => apiFetch('/orders/farmer/distributors', { auth: true }),
  farmerProducts: (id) => apiFetch('/orders/farmer/products?distributor_id=' + id, { auth: true }),
  placeFarmerOrder: (p) => apiFetch('/orders/farmer', { method: 'POST', auth: true, body: p }),
  farmerMine: () => apiFetch('/orders/farmer/mine', { auth: true }),
  incoming: () => apiFetch('/orders/distributor/incoming', { auth: true }),
  aggregate: (p) => apiFetch('/orders/distributor/aggregate', { method: 'POST', auth: true, body: p }),
  distributorPos: () => apiFetch('/orders/distributor/pos', { auth: true }),
  manufacturerIncoming: () => apiFetch('/orders/manufacturer/incoming', { auth: true }),
  setStatus: (id, status) => apiFetch('/orders/' + id + '/status', { method: 'PATCH', auth: true, body: { status } }),
  setPayment: (id, payment_status) => apiFetch('/orders/' + id + '/payment', { method: 'PATCH', auth: true, body: { payment_status } }),
  statsFarmer: () => apiFetch('/orders/stats/farmer', { auth: true }),
  statsDistributor: () => apiFetch('/orders/stats/distributor', { auth: true }),
  statsManufacturer: () => apiFetch('/orders/stats/manufacturer', { auth: true }),
};
