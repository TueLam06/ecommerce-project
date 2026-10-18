import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClass =
    'w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent';

// Trang mở từ link trong email: /reset-password?token=...
export default function ResetPasswordPage() {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (password !== confirm) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }
        setSubmitting(true);
        try {
            const user = await resetPassword(token, password);
            setDone(true);
            setTimeout(() => navigate(user.role === 'admin' ? '/admin' : '/', { replace: true }), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFAF8] px-6 py-12">
            <div className="w-full max-w-sm">
                {done ? (
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-[#2F5233] text-[#F5F3EE] flex items-center justify-center mx-auto mb-6 text-2xl">
                            ✓
                        </div>
                        <h1 className="text-2xl text-[#1A1A18] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                            Đã đổi mật khẩu
                        </h1>
                        <p className="text-sm text-[#6B6B65]">Bạn đã được đăng nhập, đang chuyển trang...</p>
                    </div>
                ) : !token ? (
                    <div className="text-center">
                        <h1 className="text-2xl text-[#1A1A18] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                            Link không hợp lệ
                        </h1>
                        <p className="text-sm text-[#6B6B65] mb-6">Link đặt lại mật khẩu bị thiếu hoặc sai.</p>
                        <Link to="/forgot-password" className="text-sm text-[#2F5233] underline underline-offset-2">
                            Yêu cầu link mới
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl text-[#1A1A18] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                            Đặt mật khẩu mới
                        </h1>
                        <p className="text-sm text-[#6B6B65] mb-8">Mật khẩu có ít nhất 6 ký tự.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="password" className="block text-sm text-[#3A3A36] mb-1.5">
                                    Mật khẩu mới
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm" className="block text-sm text-[#3A3A36] mb-1.5">
                                    Nhập lại mật khẩu
                                </label>
                                <input
                                    id="confirm"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-[#B3413B]" role="alert">
                                    <p>{error}</p>
                                    {/* Lỗi do link (hết hạn, đã dùng) thì gợi ý xin link mới */}
                                    {/link/i.test(error) && (
                                        <Link to="/forgot-password" className="text-[#2F5233] underline underline-offset-2">
                                            Yêu cầu link mới
                                        </Link>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-md bg-[#2F5233] text-[#F5F3EE] py-2.5 font-medium hover:bg-[#244027] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
