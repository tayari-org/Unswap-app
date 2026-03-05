/**
 * apiClient.js — Self-hosted API adapter
 *
 * This mirrors the base44 SDK interface so all existing pages and components
 * continue to work with zero or minimal changes:
 *
 *   api.auth.me()
 *   api.auth.login(email, password)
 *   api.auth.logout()
 *   api.auth.register(data)
 *   api.auth.updateMe(data)
 *   api.auth.isAuthenticated()
 *   api.auth.redirectToLogin(returnUrl)
 *
 *   api.entities.Property.list()
 *   api.entities.Property.filter({ owner_email: 'x@y.com' }, '-created_at')
 *   api.entities.Property.get(id)
 *   api.entities.Property.create(data)
 *   api.entities.Property.update(id, data)
 *   api.entities.Property.delete(id)
 *   ... (same for every entity)
 *
 *   api.functions.invoke('createStripeCheckoutSession', { subscription_plan_id })
 *
 *   api.integrations.Core.UploadFile({ file })
 *   api.integrations.Core.SendEmail({ to, subject, body })
 *
 *   api.asServiceRole  -- same as api (service-role is now the backend itself)
 */

// @ts-ignore — Vite injects import.meta.env at build time
const API_BASE = /** @type {any} */ (import.meta).env?.VITE_API_BASE_URL || 'http://localhost:3001';

// ─── Token management ─────────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('unswap_token');
}

function setToken(token) {
    if (token) {
        localStorage.setItem('unswap_token', token);
    } else {
        localStorage.removeItem('unswap_token');
    }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request(method, path, body = undefined, options = {}) {
    const token = getToken();
    const headers = {
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    // Try to parse JSON
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    if (!res.ok) {
        // @ts-ignore
        const err = /** @type {any} */ (new Error(data?.error || `Request failed: ${res.status}`));
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

const get = (path, params) => {
    let url = path;
    if (params && Object.keys(params).length) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object' && value !== null) {
                searchParams.append(key, JSON.stringify(value));
            } else {
                searchParams.append(key, String(value));
            }
        }
        url = `${path}?${searchParams.toString()}`;
    }
    return request('GET', url);
};
const post = (path, body) => request('POST', path, body);
const patch = (path, body) => request('PATCH', path, body);
const del = (path) => request('DELETE', path);

// ─── Auth ─────────────────────────────────────────────────────────────────────

const auth = {
    async me() {
        return get('/api/auth/me');
    },

    async login(email, password) {
        const data = await post('/api/auth/login', { email, password });
        setToken(data.token);
        return data.user;
    },

    async register(userData) {
        const data = await post('/api/auth/register', userData);
        setToken(data.token);
        return data.user;
    },

    async updateMe(updates) {
        return patch('/api/auth/me', updates);
    },

    async isAuthenticated() {
        try {
            if (!getToken()) return false;
            await get('/api/auth/is-authenticated');
            return true;
        } catch {
            return false;
        }
    },

    async forgotPassword(email) {
        return post('/api/auth/forgot-password', { email });
    },

    async resetPassword(token, newPassword) {
        return post('/api/auth/reset-password', { token, new_password: newPassword });
    },

    async googleLogin(credential, referred_by) {
        const data = await post('/api/auth/google', { credential, referred_by });
        setToken(data.token);
        return data.user;
    },

    logout(returnUrl) {
        setToken(null);
        const loginPath = '/login';
        const redirect = returnUrl ? `${loginPath}?from=${encodeURIComponent(returnUrl)}` : loginPath;
        window.location.href = redirect;
    },

    redirectToLogin(returnUrl) {
        this.logout(returnUrl);
    },
};

// ─── Entity builder ───────────────────────────────────────────────────────────
// Builds an entity object with list/filter/get/create/update/delete

function buildEntity(entityName) {
    const base = `/api/entities/${entityName}`;

    return {
        async list(sortParam) {
            /** @type {Record<string, any>} */
            const params = {};
            if (sortParam) params['_sort'] = sortParam;
            return get(base, params);
        },

        async filter(filters = {}, sortParam, limit) {
            /** @type {Record<string, any>} */
            const params = { ...filters };
            if (sortParam) params['_sort'] = sortParam;
            if (limit) params['_limit'] = limit;
            return get(base, params);
        },

        async get(id) {
            return get(`${base}/${id}`);
        },

        async create(data) {
            return post(base, data);
        },

        async update(id, data) {
            return patch(`${base}/${id}`, data);
        },

        async delete(id) {
            return del(`${base}/${id}`);
        },

        subscribe(callback) {
            console.log(`[API] Mock subscription for ${entityName} - real-time not available in self-hosted yet.`);
            return () => { }; // return a dummy unsubscribe function
        },
    };
}

// All entity types used in the app
const entities = {
    Property: buildEntity('Property'),
    User: buildEntity('User'),
    SwapRequest: buildEntity('SwapRequest'),
    Message: buildEntity('Message'),
    Notification: buildEntity('Notification'),
    Verification: buildEntity('Verification'),
    Review: buildEntity('Review'),
    VideoCall: buildEntity('VideoCall'),
    SubscriptionPlan: buildEntity('SubscriptionPlan'),
    PaymentTransaction: buildEntity('PaymentTransaction'),
    GuestPointTransaction: buildEntity('GuestPointTransaction'),
    Referral: buildEntity('Referral'),
    ActivityLog: buildEntity('ActivityLog'),
    PlatformSettings: buildEntity('PlatformSettings'),
};

// ─── Functions ────────────────────────────────────────────────────────────────

const functions = {
    async invoke(name, data = {}) {
        return post(`/api/functions/${name}`, data);
    },
};

// ─── Integrations ─────────────────────────────────────────────────────────────

const integrations = {
    Core: {
        async UploadFile({ file }) {
            const formData = new FormData();
            formData.append('file', file);
            return request('POST', '/api/upload', formData);
        },

        async SendEmail({ to, subject, body, html }) {
            return post('/api/email/send', { to, subject, body, html });
        },
    },
};

// ─── Referrals ────────────────────────────────────────────────────────────────

const referrals = {
    async getStats() {
        return get('/api/referrals/stats');
    },
    async getColleagues() {
        return get('/api/referrals/colleagues');
    }
};

// ─── Main export ───────────────────────────────────────────────────────────────

export const api = {
    auth,
    entities,
    functions,
    integrations,
    referrals,
    // asServiceRole is the same object — backend handles admin elevation via JWT role
    get asServiceRole() {
        return this;
    },
};

export default api;

