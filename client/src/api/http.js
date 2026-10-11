const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
    return data;
}

export async function authFetch(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
}

export { API_BASE, handleResponse };