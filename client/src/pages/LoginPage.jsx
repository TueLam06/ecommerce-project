import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const user = await login(email, password);

            if (from) {
                // Có nơi cụ thể bị đá ra trước đó (vd: /admin) -> quay lại đúng chỗ
                navigate(from, { replace: true });
            } else if (user.role === 'admin') {
                // Admin đăng nhập trực tiếp qua /login -> vào thẳng trang quản trị
                navigate('/admin', { replace: true });
            } else {
                // User thường -> về trang chủ
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAF8]">
            {/* Panel thương hiệu — cột hẹp bên trái, thu gọn thành header trên mobile */}
            <aside className="bg-[#2F5233] text-[#F5F3EE] px-6 py-8 md:px-10 md:py-0 md:w-[36%] lg:w-[30%] md:max-w-md flex items-center">
                <div className="max-w-xs mx-auto">
                    <p className="text-xs uppercase tracking-widest text-[#B7C9AF] mb-3">Cửa hàng của bạn</p>
                    <h1
                        className="text-2xl md:text-3xl lg:text-4xl leading-tight mb-3"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        Mua sắm dễ dàng, giao hàng an tâm.
                    </h1>
                    <p className="text-[#D8E2D2] text-sm leading-relaxed hidden md:block">
                        Đăng nhập để theo dõi đơn hàng, lưu địa chỉ và nhận ưu đãi dành riêng cho bạn.
                    </p>
                </div>
            </aside>

            {/* Form đăng nhập */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl text-[#1A1A18] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                        Đăng nhập
                    </h2>
                    <p className="text-sm text-[#6B6B65] mb-8">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-[#2F5233] underline underline-offset-2">
                            Tạo tài khoản mới
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm text-[#3A3A36] mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                                placeholder="ban@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm text-[#3A3A36] mb-1.5">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-[#B3413B]" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-md bg-[#2F5233] text-[#F5F3EE] py-2.5 font-medium hover:bg-[#244027] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
