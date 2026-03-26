/**
 * apiClient.js — Slim waitlist-only API client
 *
 * Only includes the endpoints used by the Waitlist page:
 *   api.waitlist.getCount()
 *   api.waitlist.initiateJoin(data)
 *   api.waitlist.verifyJoin(email, otp)
 *   api.waitlist.getStatus(email)
 *   api.referrals.getLeaderboard()
 */

// @ts-ignore — Vite injects import.meta.env at build time
const API_BASE = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not defined. Check your .env file.');
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request(method, path, body = undefined) {
    const headers = {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    if (!res.ok) {
        // @ts-ignore
        const err = new Error(data?.error || `Request failed: ${res.status}`);
        // @ts-ignore
        err.status = res.status;
        // @ts-ignore
        err.data = data;
        throw err;
    }

    return data;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);

// ─── Main export ───────────────────────────────────────────────────────────────

export const api = {
    waitlist: {
        async getCount() { return get('/api/waitlist/count'); },
        async initiateJoin(data) { return post('/api/waitlist/join/initiate', data); },
        async getStatus(email) { return get(`/api/waitlist/status?email=${encodeURIComponent(email)}`); }
    }
};

export default api;
