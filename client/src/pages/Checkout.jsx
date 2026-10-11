import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { saveLastGuestOrder } from "../api/orders";
import { CITIES } from "../constants/vnAddress";
import Combobox from "../components/Combobox";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

function formatVND(n) {
    return n.toLocaleString("vi-VN") + "đ";
}

// "Phường Ba Đình" -> { base: "Ba Đình", type: "phường" } để hiển thị trong dropdown
function splitWard(ward) {
    const m = ward.match(/^(Phường|Xã|Đặc khu)\s+(.+)$/);
    return m ? { base: m[2], type: m[1].toLowerCase() } : { base: ward, type: "" };
}

// Bỏ khoảng trắng/dấu chấm/gạch, +84 -> 0
function normalizePhone(phone) {
    return phone.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

const PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;
const NAME_REGEX = /^[\p{L}\s'.]+$/u;

// Trả về { tên field: thông báo lỗi } — rỗng nghĩa là hợp lệ
function validate(data) {
    const errors = {};
    const name = data.name.trim();
    if (!name) errors.name = "Vui lòng nhập họ và tên";
    else if (name.length < 2 || name.length > 50) errors.name = "Họ tên dài từ 2 đến 50 ký tự";
    else if (!NAME_REGEX.test(name)) errors.name = "Họ tên chỉ gồm chữ cái và khoảng trắng";

    const phone = normalizePhone(data.phone);
    if (!phone) errors.phone = "Vui lòng nhập số điện thoại";
    else if (!PHONE_REGEX.test(phone))
        errors.phone = "Số điện thoại không hợp lệ";

    const city = CITIES.find((c) => c.name === data.city);
    if (!city) errors.city = "Vui lòng chọn thành phố";
    if (!city || !city.wards.includes(data.ward)) errors.ward = "Vui lòng chọn phường/xã";

    const street = data.street.trim();
    if (!street) errors.street = "Vui lòng nhập số nhà, tên đường";
    else if (street.length < 5 || street.length > 150) errors.street = "Địa chỉ cụ thể dài từ 5 đến 150 ký tự";

    return errors;
}

const inputClass = (hasError) =>
    `w-full px-3.5 py-2.5 bg-transparent border rounded-sm text-[#1F2420] placeholder:text-[#B0AC9C] outline-none focus:ring-1 transition-colors ${
        hasError
            ? "border-[#B3413B] focus:border-[#B3413B] focus:ring-[#B3413B]"
            : "border-[#DAD6C9] focus:border-[#2F5233] focus:ring-[#2F5233]"
    }`;

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="mt-1.5 text-sm text-[#B3413B]">
            {message}
        </p>
    );
}

function Checkout() {
    const { cart, total, clearCart } = useCart();
    const { token } = useAuth();
    const [formData, setFormData] = useState({ name: "", phone: "", city: "", ward: "", street: "" });
    // Chỉ báo lỗi ô người dùng đã rời khỏi, hoặc tất cả sau khi bấm đặt hàng
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [orderResult, setOrderResult] = useState(null); // { orderId, total } khi thành công

    const fieldErrors = validate(formData);
    const selectedCity = CITIES.find((c) => c.name === formData.city);
    const errorOf = (field) => (touched[field] ? fieldErrors[field] : undefined);

    const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));
    const wardOptions = (selectedCity?.wards || []).map((w) => {
        const { base, type } = splitWard(w);
        return { value: w, label: base, hint: type };
    });

    function setField(name, value) {
        // Đổi thành phố thì phải chọn lại phường/xã
        setFormData((prev) => ({ ...prev, [name]: value, ...(name === "city" && value !== prev.city && { ward: "" }) }));
        if (error) setError(null);
    }

    function markTouched(name) {
        setTouched((prev) => ({ ...prev, [name]: true }));
    }

    function handleChange(e) {
        setField(e.target.name, e.target.value);
    }

    function handleBlur(e) {
        markTouched(e.target.name);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (Object.keys(fieldErrors).length > 0) {
            setTouched({ name: true, phone: true, city: true, ward: true, street: true });
            document.getElementById(Object.keys(fieldErrors)[0])?.focus();
            return;
        }
        setSubmitting(true);

        const phone = normalizePhone(formData.phone);
        const body = {
            customer_name: formData.name.trim(),
            phone,
            address: `${formData.street.trim()}, ${formData.ward}, ${formData.city}`,
            ...(!token && {
                cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
            }),
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Đặt hàng thất bại");

            setOrderResult({ orderId: data.orderId, total: data.total, phone });
            if (!token) saveLastGuestOrder(data.orderId, phone);
            clearCart();
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    }

    // Màn hình xác nhận sau khi đặt hàng thành công
    if (orderResult) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#FAFAF8] px-6">
                <div className="text-center max-w-md">
                    <div className="w-14 h-14 rounded-full bg-[#2F5233] text-[#F5F3EE] flex items-center justify-center mx-auto mb-6 text-2xl">
                        ✓
                    </div>
                    <h1 style={fraunces} className="text-3xl text-[#1F2420] mb-3">
                        Đặt hàng thành công
                    </h1>
                    <p style={inter} className="text-[#6B6F63] mb-1">
                        Mã đơn hàng <span className="text-[#1F2420] font-medium">#{orderResult.orderId}</span>
                    </p>
                    <p style={inter} className="text-[#6B6F63] mb-8">
                        Tổng thanh toán: <span className="text-[#1F2420] font-medium">{formatVND(orderResult.total)}</span>
                    </p>
                    <p style={inter} className="text-[#6B6F63] text-sm mb-8">
                        Chúng tôi sẽ liên hệ qua số điện thoại bạn đã cung cấp để xác nhận đơn.
                        {!token && (
                            <>
                                {" "}Hãy lưu lại <span className="text-[#1F2420] font-medium">mã đơn #{orderResult.orderId}</span> —
                                bạn có thể tra cứu trạng thái đơn bất cứ lúc nào bằng mã này và số điện thoại.
                            </>
                        )}
                    </p>
                    <Link
                        to="/products"
                        style={inter}
                        className="inline-block px-6 py-3 bg-[#2F5233] text-[#F5F3EE] rounded-sm hover:bg-[#26401E] transition-colors"
                    >
                        Tiếp tục mua sắm
                    </Link>
                    <div className="mt-4">
                        <Link
                            to={token ? `/orders/${orderResult.orderId}` : "/track-order"}
                            state={token ? undefined : { orderId: orderResult.orderId, phone: orderResult.phone }}
                            style={inter}
                            className="text-sm text-[#2F5233] underline underline-offset-2"
                        >
                            Xem trạng thái đơn hàng
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFAF8] px-6">
                <div className="text-center max-w-sm">
                    <h1 style={fraunces} className="text-3xl text-[#1F2420] mb-2">
                        Giỏ hàng đang trống
                    </h1>
                    <p style={inter} className="text-[#6B6F63] mb-6">
                        Thêm vài món đồ vào giỏ trước khi thanh toán nhé.
                    </p>
                    <Link
                        to="/products"
                        style={inter}
                        className="inline-block px-5 py-2.5 bg-[#2F5233] text-[#F5F3EE] rounded-sm hover:bg-[#26401E] transition-colors"
                    >
                        Xem sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8] grid lg:grid-cols-[42%_58%]">
            <div className="bg-[#2F5233] text-[#F5F3EE] px-8 py-12 lg:px-12 lg:py-16 flex flex-col">
                <h1 style={fraunces} className="text-3xl mb-1">Đơn hàng của bạn</h1>
                <p style={inter} className="text-[#B9C4AE] text-sm mb-10">
                    {cart.length} sản phẩm
                </p>

                <div className="flex-1 space-y-0">
                    {cart.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-baseline justify-between py-3 border-t border-[#F5F3EE]/15"
                        >
                            <div style={inter} className="pr-4">
                                <div className="text-[15px]">{item.name}</div>
                                <div className="text-[#B9C4AE] text-sm">x{item.quantity}</div>
                            </div>
                            <div style={inter} className="text-[15px] whitespace-nowrap">
                                {formatVND(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-[#F5F3EE]/25 mt-4 pt-6 flex items-baseline justify-between">
                    <span style={inter} className="text-[#B9C4AE] text-sm">Tổng cộng</span>
                    <span style={fraunces} className="text-4xl">{formatVND(total)}</span>
                </div>
            </div>

            <div className="px-8 py-12 lg:px-16 lg:py-16 max-w-xl">
                <h2 style={fraunces} className="text-2xl text-[#1F2420] mb-1">
                    Thông tin giao hàng
                </h2>
                <p style={inter} className="text-[#6B6F63] mb-8">
                    Chúng tôi sẽ liên hệ qua số điện thoại này để xác nhận đơn.
                </p>

                <form onSubmit={handleSubmit} noValidate style={inter} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm text-[#6B6F63] mb-1.5">
                            Họ và tên
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            autoComplete="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Nguyễn Văn A"
                            aria-invalid={Boolean(errorOf("name"))}
                            aria-describedby="name-error"
                            className={inputClass(errorOf("name"))}
                        />
                        <FieldError id="name-error" message={errorOf("name")} />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm text-[#6B6F63] mb-1.5">
                            Số điện thoại
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            inputMode="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="09xx xxx xxx"
                            aria-invalid={Boolean(errorOf("phone"))}
                            aria-describedby="phone-error"
                            className={inputClass(errorOf("phone"))}
                        />
                        <FieldError id="phone-error" message={errorOf("phone")} />
                    </div>

                    <fieldset className="space-y-4">
                        <legend className="block text-sm text-[#6B6F63] mb-1.5">
                            Địa chỉ giao hàng
                            <span className="text-[#B0AC9C]"> (hiện chỉ giao tại Hà Nội và TP.HCM)</span>
                        </legend>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="city" className="sr-only">Thành phố</label>
                                <Combobox
                                    id="city"
                                    value={formData.city}
                                    options={cityOptions}
                                    onChange={(v) => setField("city", v)}
                                    onClose={() => markTouched("city")}
                                    placeholder="Chọn thành phố"
                                    searchable={false}
                                    invalid={Boolean(errorOf("city"))}
                                    describedBy="city-error"
                                />
                                <FieldError id="city-error" message={errorOf("city")} />
                            </div>

                            <div>
                                <label htmlFor="ward" className="sr-only">Phường/Xã</label>
                                <Combobox
                                    id="ward"
                                    value={formData.ward}
                                    options={wardOptions}
                                    onChange={(v) => setField("ward", v)}
                                    onClose={() => markTouched("ward")}
                                    placeholder={selectedCity ? "Chọn phường/xã" : "Chọn thành phố trước"}
                                    searchPlaceholder="Tìm phường/xã, không cần gõ dấu"
                                    disabled={!selectedCity}
                                    invalid={Boolean(errorOf("ward"))}
                                    describedBy="ward-error"
                                />
                                <FieldError id="ward-error" message={errorOf("ward")} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="street" className="sr-only">Số nhà, tên đường</label>
                            <input
                                id="street"
                                type="text"
                                name="street"
                                autoComplete="address-line1"
                                value={formData.street}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Số nhà, ngõ/hẻm, tên đường (VD: 12 ngõ 34 Trần Duy Hưng)"
                                aria-invalid={Boolean(errorOf("street"))}
                                aria-describedby="street-error"
                                className={inputClass(errorOf("street"))}
                            />
                            <FieldError id="street-error" message={errorOf("street")} />
                        </div>
                    </fieldset>

                    {error && <p className="text-[#B3413B] text-sm -mt-2">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-[#2F5233] text-[#F5F3EE] rounded-sm hover:bg-[#26401E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? "Đang xử lý..." : `Đặt hàng — ${formatVND(total)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Checkout;