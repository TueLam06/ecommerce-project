import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { trackOrder, readLastGuestOrder } from "../api/orders";
import { STATUS_LABELS, STATUS_BADGE } from "../constants/orderStatus";
import OrderDetailView from "../components/OrderDetailView";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

// Tra cứu đơn hàng cho khách không đăng nhập: nhập mã đơn + số điện thoại
function TrackOrder() {
    const location = useLocation();
    // Vừa đặt hàng xong (Checkout chuyển sang kèm state) thì tra luôn
    const fromCheckout = location.state?.orderId && location.state?.phone ? location.state : null;
    const initial = fromCheckout || readLastGuestOrder() || { orderId: "", phone: "" };

    const [form, setForm] = useState({ orderId: String(initial.orderId), phone: initial.phone });
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(Boolean(fromCheckout));
    const [error, setError] = useState("");

    const lookup = (orderId, phone) => {
        setLoading(true);
        setError("");
        return trackOrder(orderId, phone)
            .then(setOrder)
            .catch((err) => {
                setOrder(null);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!fromCheckout) return;
        trackOrder(fromCheckout.orderId, fromCheckout.phone)
            .then(setOrder)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [fromCheckout]);

    const handleSubmit = (e) => {
        e.preventDefault();
        lookup(form.orderId.trim(), form.phone.trim());
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen bg-[#FAFAF8] px-6 py-12">
            <div className="max-w-4xl mx-auto" style={inter}>
                <h1 style={fraunces} className="text-3xl text-[#1F2420] mb-2">
                    Tra cứu đơn hàng
                </h1>
                <p className="text-[#6B6F63] mb-6">
                    Nhập mã đơn hàng và số điện thoại bạn đã dùng khi đặt hàng.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-md border border-[#E5E3DC] bg-white p-5 mb-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                    <label className="block text-sm">
                        <span className="text-[#6B6F63]">Mã đơn hàng</span>
                        <input
                            name="orderId"
                            value={form.orderId}
                            onChange={handleChange}
                            placeholder="VD: 128"
                            inputMode="numeric"
                            required
                            className="mt-1 w-full rounded-sm border border-[#D9D6CC] px-3 py-2.5 text-[#1F2420] focus:outline-none focus:border-[#2F5233]"
                        />
                    </label>
                    <label className="block text-sm">
                        <span className="text-[#6B6F63]">Số điện thoại</span>
                        <input
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="VD: 0901234567"
                            required
                            className="mt-1 w-full rounded-sm border border-[#D9D6CC] px-3 py-2.5 text-[#1F2420] focus:outline-none focus:border-[#2F5233]"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#2F5233] text-[#F5F3EE] rounded-sm hover:bg-[#26401E] disabled:opacity-60 transition-colors"
                    >
                        {loading ? "Đang tìm..." : "Tra cứu"}
                    </button>
                </form>

                {error && (
                    <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm mb-6">
                        {error}
                    </div>
                )}

                {order && (
                    <>
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <h2 style={fraunces} className="text-2xl text-[#1F2420]">
                                Đơn hàng #{order.id}
                            </h2>
                            <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[order.status] || ""}`}
                            >
                                {STATUS_LABELS[order.status] || order.status}
                            </span>
                        </div>
                        <OrderDetailView order={order} />
                        {order.status === "pending" && (
                            <p className="mt-6 text-sm text-[#6B6F63]">
                                Muốn huỷ hoặc thay đổi đơn? Vui lòng liên hệ cửa hàng qua số điện thoại hỗ trợ.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default TrackOrder;
