import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setSubmitting(true);
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAF8]">
            <div className="bg-[#2F5233] text-[#F5F3EE] px-8 py-10 md:py-0 md:w-1/2 flex items-center">
                <div className="max-w-sm mx-auto md:mx-0 md:ml-auto md:mr-16">
                    <p className="text-sm tracking-wide text-[#B7C9AF] mb-3">Cửa hàng của bạn</p>
                    <h1
                        className="text-3xl md:text-5xl leading-tight mb-4"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        Tham gia cùng hàng ngàn khách hàng khác.
                    </h1>
                    <p className="text-[#D8E2D2] text-sm md:text-base hidden md:block">
                        Tạo tài khoản chỉ mất chưa đầy một phút.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl text-[#1A1A18] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                        Tạo tài khoản
                    </h2>
                    <p className="text-sm text-[#6B6B65] mb-8">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-[#2F5233] underline underline-offset-2">
                            Đăng nhập
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm text-[#3A3A36] mb-1.5">
                                Họ và tên
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

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
                                placeholder="Ít nhất 6 ký tự"
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
                            {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}