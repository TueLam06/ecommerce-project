// Nơi duy nhất đọc địa chỉ backend. Giá trị lấy từ .env.development (npm run dev) hoặc .env.production (npm run build)
const API_BASE = import.meta.env.VITE_API_URL;

async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error || data.message || 'Có lỗi xảy ra, vui lòng thử lại');
        err.code = data.code; // vd: EMAIL_NOT_VERIFIED
        throw err;
    }
    return data;
}

export async function authFetch(path, { method = 'GET', body, token } = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Lỗi kết nối, thử lại sau');
    }
    return handleResponse(res);
}

export { API_BASE, handleResponse };
