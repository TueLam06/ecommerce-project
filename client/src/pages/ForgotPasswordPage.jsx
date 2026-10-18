import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../api/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // { ok, text }
    const [sending, setSending] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setSending(true);
        setStatus(null);
        try {
            const data = await forgotPasswordRequest(email.trim());
            setStatus({ ok: true, text: data.message });
        } catch (err) {
            setStatus({ ok: false, text: err.message });
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFAF8] px-6 py-12">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl text-[#1A1A18] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                    Quên mật khẩu
                </h1>
                <p className="text-sm text-[#6B6B65] mb-8">
                    Nhập email đã đăng ký, chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.
                </p>

                {status?.ok ? (
                    <p className="text-sm text-[#2F5233]" role="status">{status.text}</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm text-[#3A3A36] mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                                placeholder="ban@email.com"
                            />
                        </div>

                        {status && (
                            <p className="text-sm text-[#B3413B]" role="alert">{status.text}</p>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full rounded-md bg-[#2F5233] text-[#F5F3EE] py-2.5 font-medium hover:bg-[#244027] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                        </button>
                    </form>
                )}

                <p className="text-sm text-[#6B6B65] mt-6">
                    <Link to="/login" className="text-[#2F5233] underline underline-offset-2">
                        Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
