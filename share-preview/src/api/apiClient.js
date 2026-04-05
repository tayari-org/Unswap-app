const API_BASE = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE) throw new Error('VITE_API_BASE_URL is not defined. Check your .env file.');

async function request(method, path, body = undefined) {
    const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}) };
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
        const err = new Error(data?.error || `Request failed: ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

const get = (path) => request('GET', path);

export const api = {
    waitlist: {
        async getStatus(email) { return get(`/api/waitlist/status?email=${encodeURIComponent(email)}`); }
    }
};

export default api;
