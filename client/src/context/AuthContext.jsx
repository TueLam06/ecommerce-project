import { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest, registerRequest, getMeRequest } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Khi app khởi động, nếu đã có token lưu sẵn thì lấy lại thông tin user
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
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

    async function register(name, email, password) {
        const data = await registerRequest({ name, email, password });
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
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth phải được gọi bên trong <AuthProvider>');
    return ctx;
}