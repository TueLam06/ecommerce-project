import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

const inputClass =
    "w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent";
const buttonClass =
    "rounded-md bg-[#2F5233] text-[#F5F3EE] px-5 py-2.5 font-medium hover:bg-[#244027] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

function Card({ title, children }) {
    return (
        <section className="rounded-md border border-[#E5E3DC] bg-white p-6 mb-6">
            <h2 style={fraunces} className="text-xl text-[#1F2420] mb-5">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Feedback({ error, success }) {
    if (error) return <p className="text-sm text-[#B3413B]" role="alert">{error}</p>;
    if (success) return <p className="text-sm text-[#2F5233]">{success}</p>;
    return null;
}

function InfoForm() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);
        try {
            await updateProfile(name.trim());
            setSuccess("Đã cập nhật thông tin");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card title="Thông tin tài khoản">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm text-[#3A3A36] mb-1.5">
                        Email
                    </label>
                    <input id="email" value={user.email} disabled className={`${inputClass} bg-[#F3F1EA] text-[#6B6F63]`} />
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm text-[#3A3A36] mb-1.5">
                        Họ tên
                    </label>
                    <input
                        id="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                    />
                </div>
                {user.created_at && (
                    <p className="text-sm text-[#6B6F63]">
                        Thành viên từ {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </p>
                )}
                <Feedback error={error} success={success} />
                <button type="submit" disabled={saving || !name.trim() || name.trim() === user.name} className={buttonClass}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
            </form>
        </Card>
    );
}

function PasswordForm() {
    const { changePassword } = useAuth();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (next.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }
        if (next !== confirm) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }
        setSaving(true);
        try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            setConfirm("");
            setSuccess("Đã đổi mật khẩu");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card title="Đổi mật khẩu">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="current" className="block text-sm text-[#3A3A36] mb-1.5">
                        Mật khẩu hiện tại
                    </label>
                    <input
                        id="current"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="next" className="block text-sm text-[#3A3A36] mb-1.5">
                        Mật khẩu mới
                    </label>
                    <input
                        id="next"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="confirm" className="block text-sm text-[#3A3A36] mb-1.5">
                        Nhập lại mật khẩu mới
                    </label>
                    <input
                        id="confirm"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <Feedback error={error} success={success} />
                <button type="submit" disabled={saving} className={buttonClass}>
                    {saving ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
            </form>
        </Card>
    );
}

function ProfilePage() {
    return (
        <div className="min-h-screen bg-[#FAFAF8] px-6 py-12">
            <div className="max-w-xl mx-auto" style={inter}>
                <h1 style={fraunces} className="text-3xl text-[#1F2420] mb-1">
                    Tài khoản của tôi
                </h1>
                <p className="text-[#6B6F63] mb-8">
                    Quản lý thông tin cá nhân và mật khẩu.{" "}
                    <Link to="/orders" className="text-[#2F5233] underline underline-offset-2">
                        Xem đơn hàng
                    </Link>
                </p>

                <InfoForm />
                <PasswordForm />
            </div>
        </div>
    );
}

export default ProfilePage;
