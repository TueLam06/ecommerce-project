import { useState, useEffect } from 'react';
import { loginRequest, registerRequest, getMeRequest, verifyEmailRequest } from '../api/auth';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    // Chỉ cần chờ khi có token lưu sẵn (phải gọi /me lấy lại user)
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

    // Khi app khởi động, nếu đã có token lưu sẵn thì lấy lại thông tin user
    useEffect(() => {
        if (!token) return;
        getMeRequest(token)
            .then((data) => setUser(data.user))
            .catch(() => {
                // token hết hạn hoặc không hợp lệ -> đăng xuất
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [token]);

    async function login(email, password) {
        const data = await loginRequest({ email, password });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    // Đăng ký xong chưa đăng nhập ngay, phải xác thực email trước
    async function register(name, email, password) {
        return registerRequest({ name, email, password });
    }

    // Bấm link trong email -> xác thực xong thì đăng nhập luôn
    async function verifyEmail(emailToken) {
        const data = await verifyEmailRequest(emailToken);
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    function logout() {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, verifyEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}