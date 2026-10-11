import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendVerification from '../components/ResendVerification';

// Trang mở từ link trong email: /verify-email?token=...
export default function VerifyEmailPage() {
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [error, setError] = useState(token ? '' : 'Link xác thực không hợp lệ');
    const [verified, setVerified] = useState(false);
    const calledRef = useRef(false); // StrictMode chạy effect 2 lần ở dev

    useEffect(() => {
        if (!token || calledRef.current) return;
        calledRef.current = true;

        verifyEmail(token)
            .then(() => {
                setVerified(true);
                setTimeout(() => navigate('/', { replace: true }), 2000);
            })
            .catch((err) => setError(err.message));
    }, [token, verifyEmail, navigate]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFAF8] px-6 py-12">
            <div className="w-full max-w-sm text-center">
                {verified ? (
                    <>
                        <div className="w-14 h-14 rounded-full bg-[#2F5233] text-[#F5F3EE] flex items-center justify-center mx-auto mb-6 text-2xl">
                            ✓
                        </div>
                        <h1 className="text-2xl text-[#1A1A18] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                            Xác thực thành công
                        </h1>
                        <p className="text-sm text-[#6B6B65]">Bạn đã được đăng nhập, đang chuyển về trang chủ...</p>
                    </>
                ) : error ? (
                    <>
                        <h1 className="text-2xl text-[#1A1A18] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                            Không xác thực được email
                        </h1>
                        <p className="text-sm text-[#B3413B] mb-8" role="alert">{error}</p>
                        <div className="text-left">
                            <ResendVerification />
                        </div>
                        <p className="text-sm text-[#6B6B65] mt-6">
                            <Link to="/login" className="text-[#2F5233] underline underline-offset-2">
                                Quay lại đăng nhập
                            </Link>
                        </p>
                    </>
                ) : (
                    <p className="text-[#6B6B65]">Đang xác thực email...</p>
                )}
            </div>
        </div>
    );
}
