const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
    }
    return data;
}

export async function registerRequest({ name, email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
}


export async function loginRequest({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
}

export async function getMeRequest(token) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
}