import { useState } from 'react';
import { resendVerificationRequest } from '../api/auth';

// Nút "Gửi lại email xác thực". Không truyền email thì hiện ô nhập email
export default function ResendVerification({ email: initialEmail = '' }) {
    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState(null); // { ok, text }
    const [sending, setSending] = useState(false);

    async function handleResend(e) {
        e.preventDefault();
        setSending(true);
        setStatus(null);
        try {
            const data = await resendVerificationRequest(email);
            setStatus({ ok: true, text: data.message });
        } catch (err) {
            setStatus({ ok: false, text: err.message });
        } finally {
            setSending(false);
        }
    }

    return (
        <form onSubmit={handleResend} className="space-y-3">
            {!initialEmail && (
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
                    placeholder="ban@email.com"
                />
            )}
            <button
                type="submit"
                disabled={sending}
                className="w-full rounded-md border border-[#2F5233] text-[#2F5233] py-2.5 font-medium hover:bg-[#2F5233] hover:text-[#F5F3EE] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {sending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
            </button>
            {status && (
                <p className={`text-sm ${status.ok ? 'text-[#2F5233]' : 'text-[#B3413B]'}`} role="status">
                    {status.text}
                </p>
            )}
        </form>
    );
}
