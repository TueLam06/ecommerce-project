import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CITIES } from "../constants/vnAddress";
import Combobox from "../components/Combobox";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

const inputClass =
    "w-full rounded-md border border-[#D9D6CC] bg-white px-3.5 py-2.5 text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2F5233] focus:border-transparent";
const buttonClass =
    "rounded-md bg-[#2F5233] text-[#F5F3EE] px-5 py-2.5 text-sm font-medium hover:bg-[#244027] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const outlineButtonClass =
    "rounded-md border border-[#2F5233] text-[#2F5233] px-5 py-2.5 text-sm font-medium hover:bg-[#2F5233] hover:text-[#F5F3EE] transition-colors";
const cancelButtonClass =
    "rounded-md border border-[#D9D6CC] text-[#3A3A36] px-5 py-2.5 text-sm font-medium hover:border-[#2F5233] transition-colors";

const PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;

const ROLE_LABELS = { admin: "Quản trị viên", customer: "Khách hàng" };

function Feedback({ error, success }) {
    if (error) return <p className="text-sm text-[#B3413B]" role="alert">{error}</p>;
    if (success) return <p className="text-sm text-[#2F5233]">{success}</p>;
    return null;
}

// Header trang: avatar chữ cái đầu + tên + email + vai trò
function ProfileHeader({ user }) {
    return (
        <div className="rounded-md border border-[#E5E3DC] bg-white overflow-hidden mb-6">
            <div className="h-20 bg-[#2F5233]" />
            <div className="px-6 pb-6">
                <div
                    style={fraunces}
                    className="-mt-10 mb-3 w-20 h-20 rounded-full bg-[#F5F3EE] border-4 border-white text-[#2F5233] text-3xl flex items-center justify-center uppercase"
                >
                    {user.name.trim().charAt(0)}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 style={fraunces} className="text-2xl text-[#1F2420]">
                        {user.name}
                    </h1>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#EAF0E6] text-[#2F5233]">
                        {ROLE_LABELS[user.role] || user.role}
                    </span>
                </div>
                <p className="text-[#6B6F63] text-sm mt-1">{user.email}</p>
            </div>
        </div>
    );
}

function Empty() {
    return <span className="text-[#B0AC9C]">Chưa cập nhật</span>;
}

function InfoRow({ label, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-[#EFEDE6] last:border-0">
            <dt className="sm:w-40 text-sm text-[#6B6F63]">{label}</dt>
            <dd className="flex-1 text-[#1F2420]">{children}</dd>
        </div>
    );
}

// Xem thông tin cơ bản; bấm "Chỉnh sửa" mới hiện form đổi tên
function InfoCard() {
    const { user, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: user.name, phone: "", city: "", ward: "", street: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function startEdit() {
        setForm({ name: user.name, phone: user.phone, city: user.city, ward: user.ward, street: user.street });
        setError("");
        setSuccess("");
        setEditing(true);
    }

    function setField(field, value) {
        // Đổi thành phố thì phải chọn lại phường/xã
        setForm((prev) => ({ ...prev, [field]: value, ...(field === "city" && value !== prev.city && { ward: "" }) }));
    }

    const selectedCity = CITIES.find((c) => c.name === form.city);
    const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));
    const wardOptions = (selectedCity?.wards || []).map((w) => ({ value: w, label: w }));

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const phone = form.phone.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
        const street = form.street.trim();
        if (phone && !PHONE_REGEX.test(phone)) {
            setError("Số điện thoại không hợp lệ");
            return;
        }
        // Địa chỉ phải đủ 3 phần hoặc để trống hẳn
        const addressParts = [form.city, form.ward, street].filter(Boolean).length;
        if (addressParts > 0 && addressParts < 3) {
            setError("Vui lòng nhập đủ thành phố, phường/xã và số nhà, tên đường (hoặc để trống cả ba)");
            return;
        }
        if (street && (street.length < 5 || street.length > 150)) {
            setError("Địa chỉ cụ thể dài từ 5 đến 150 ký tự");
            return;
        }

        setSaving(true);
        try {
            await updateProfile({ name: form.name.trim(), phone, city: form.city, ward: form.ward, street });
            setEditing(false);
            setSuccess("Đã cập nhật thông tin");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="rounded-md border border-[#E5E3DC] bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
                <h2 style={fraunces} className="text-xl text-[#1F2420]">
                    Thông tin cơ bản
                </h2>
                {!editing && (
                    <button onClick={startEdit} className={outlineButtonClass}>
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {editing ? (
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div>
                        <label htmlFor="name" className="block text-sm text-[#3A3A36] mb-1.5">
                            Họ tên
                        </label>
                        <input
                            id="name"
                            required
                            autoFocus
                            maxLength={100}
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm text-[#3A3A36] mb-1.5">
                            Số điện thoại
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            value={form.phone}
                            onChange={(e) => setField("phone", e.target.value)}
                            className={inputClass}
                            placeholder="09xx xxx xxx"
                        />
                    </div>
                    <fieldset className="space-y-4">
                        <legend className="block text-sm text-[#3A3A36] mb-1.5">
                            Địa chỉ giao hàng
                            <span className="text-[#B0AC9C]"> (chỉ giao tại Hà Nội và TP.HCM)</span>
                        </legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Combobox
                                id="city"
                                value={form.city}
                                options={cityOptions}
                                onChange={(v) => setField("city", v)}
                                placeholder="Chọn thành phố"
                                searchable={false}
                            />
                            <Combobox
                                id="ward"
                                value={form.ward}
                                options={wardOptions}
                                onChange={(v) => setField("ward", v)}
                                placeholder={selectedCity ? "Chọn phường/xã" : "Chọn thành phố trước"}
                                searchPlaceholder="Tìm phường/xã, không cần gõ dấu"
                                disabled={!selectedCity}
                            />
                        </div>
                        <input
                            id="street"
                            autoComplete="address-line1"
                            maxLength={150}
                            value={form.street}
                            onChange={(e) => setField("street", e.target.value)}
                            className={inputClass}
                            placeholder="Số nhà, ngõ/hẻm, tên đường"
                        />
                    </fieldset>
                    <p className="text-sm text-[#6B6F63]">Email không thể thay đổi.</p>
                    <Feedback error={error} />
                    <div className="flex gap-3">
                        <button type="submit" disabled={saving || !form.name.trim()} className={buttonClass}>
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button type="button" onClick={() => setEditing(false)} className={cancelButtonClass}>
                            Huỷ
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <dl>
                        <InfoRow label="Họ tên">{user.name}</InfoRow>
                        <InfoRow label="Email">{user.email}</InfoRow>
                        <InfoRow label="Số điện thoại">{user.phone || <Empty />}</InfoRow>
                        <InfoRow label="Địa chỉ">
                            {user.street ? `${user.street}, ${user.ward}, ${user.city}` : <Empty />}
                        </InfoRow>
                        {user.created_at && (
                            <InfoRow label="Thành viên từ">
                                {new Date(user.created_at).toLocaleDateString("vi-VN")}
                            </InfoRow>
                        )}
                    </dl>
                    <div className="mt-3">
                        <Feedback success={success} />
                    </div>
                </>
            )}
        </section>
    );
}

// Đổi mật khẩu thu gọn sau một nút để trang chỉ hiện thông tin cơ bản
function PasswordCard() {
    const { changePassword } = useAuth();
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function close() {
        setOpen(false);
        setCurrent("");
        setNext("");
        setConfirm("");
        setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
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
            close();
            setSuccess("Đã đổi mật khẩu");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const fields = [
        { id: "current", label: "Mật khẩu hiện tại", value: current, set: setCurrent, auto: "current-password" },
        { id: "next", label: "Mật khẩu mới", value: next, set: setNext, auto: "new-password" },
        { id: "confirm", label: "Nhập lại mật khẩu mới", value: confirm, set: setConfirm, auto: "new-password" },
    ];

    return (
        <section className="rounded-md border border-[#E5E3DC] bg-white p-6">
            <div className="flex items-center justify-between">
                <h2 style={fraunces} className="text-xl text-[#1F2420]">
                    Mật khẩu
                </h2>
                {!open && (
                    <button
                        onClick={() => {
                            setSuccess("");
                            setOpen(true);
                        }}
                        className={outlineButtonClass}
                    >
                        Đổi mật khẩu
                    </button>
                )}
            </div>

            {!open && success && (
                <div className="mt-3">
                    <Feedback success={success} />
                </div>
            )}

            {open && (
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {fields.map((f) => (
                        <div key={f.id}>
                            <label htmlFor={f.id} className="block text-sm text-[#3A3A36] mb-1.5">
                                {f.label}
                            </label>
                            <input
                                id={f.id}
                                type="password"
                                required
                                autoComplete={f.auto}
                                value={f.value}
                                onChange={(e) => f.set(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    ))}
                    <Feedback error={error} />
                    <div className="flex gap-3">
                        <button type="submit" disabled={saving} className={buttonClass}>
                            {saving ? "Đang lưu..." : "Lưu mật khẩu"}
                        </button>
                        <button type="button" onClick={close} className={cancelButtonClass}>
                            Huỷ
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}

function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#FAFAF8] px-6 py-12">
            <div className="max-w-xl mx-auto" style={inter}>
                <ProfileHeader user={user} />
                <InfoCard />
                <PasswordCard />
                <p className="text-sm text-[#6B6F63] mt-6 text-center">
                    <Link to="/orders" className="text-[#2F5233] underline underline-offset-2">
                        Xem đơn hàng của tôi
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ProfilePage;
