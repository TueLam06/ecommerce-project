import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, cancelMyOrder } from "../api/orders";
import { STATUS_LABELS, STATUS_BADGE } from "../constants/orderStatus";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

function formatVND(n) {
    return Number(n).toLocaleString("vi-VN") + "đ";
}

const FILTERS = [{ value: "", label: "Tất cả" }].concat(
    Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
);

function OrderHistory() {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyOrders(token)
            .then(setOrders)
            .catch((err) => setError(err.message || "Lỗi tải lịch sử đơn hàng"))
            .finally(() => setLoading(false));
    }, [token]);

    const [cancellingId, setCancellingId] = useState(null);

    const handleCancel = async (id) => {
        if (!window.confirm(`Huỷ đơn hàng #${id}?`)) return;
        setCancellingId(id);
        try {
            const updated = await cancelMyOrder(id, token);
            setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
        } catch (err) {
            alert(err.message || "Lỗi huỷ đơn hàng");
        } finally {
            setCancellingId(null);
        }
    };

    const visibleOrders = filter ? orders.filter((o) => o.status === filter) : orders;

    return (
        <div className="min-h-screen bg-[#FAFAF8] px-6 py-12">
            <div className="max-w-4xl mx-auto" style={inter}>
                <h1 style={fraunces} className="text-3xl text-[#1F2420] mb-1">
                    Đơn hàng của tôi
                </h1>
                <p className="text-[#6B6F63] mb-8">
                    {orders.length > 0 ? `Bạn đã đặt ${orders.length} đơn hàng` : "Lịch sử mua hàng của bạn"}
                </p>

                {orders.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-3 py-1.5 rounded-sm text-sm border transition-colors ${
                                    filter === f.value
                                        ? "bg-[#2F5233] text-[#F5F3EE] border-[#2F5233]"
                                        : "bg-white text-[#1F2420] border-[#DAD6C9] hover:border-[#2F5233]"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm">
                        Lỗi: {error}
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-[#6B6F63] mb-6">Bạn chưa có đơn hàng nào.</p>
                        <Link
                            to="/products"
                            className="inline-block px-5 py-2.5 bg-[#2F5233] text-[#F5F3EE] rounded-sm hover:bg-[#26401E] transition-colors"
                        >
                            Mua sắm ngay
                        </Link>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && visibleOrders.length === 0 && (
                    <p className="text-center py-10 text-[#6B6F63]">Không có đơn hàng nào ở trạng thái này.</p>
                )}

                <div className="space-y-4">
                    {visibleOrders.map((order) => (
                        <div key={order.id} className="rounded-md border border-[#E5E3DC] bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#EFEDE6]">
                                <div className="text-sm">
                                    <span className="font-medium text-[#1F2420]">Đơn #{order.id}</span>
                                    <span className="text-[#6B6F63] ml-3">
                                        {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : ""}
                                    </span>
                                </div>
                                <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[order.status] || ""}`}
                                >
                                    {STATUS_LABELS[order.status] || order.status}
                                </span>
                            </div>

                            <div className="px-5 divide-y divide-[#EFEDE6]">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 py-3">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.product_name}
                                                className="w-14 h-14 object-cover rounded-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-sm bg-[#EFEDE6] flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[15px] text-[#1F2420] truncate">{item.product_name}</div>
                                            <div className="text-sm text-[#6B6F63]">x{item.quantity}</div>
                                        </div>
                                        <div className="text-[15px] text-[#1F2420] whitespace-nowrap">
                                            {formatVND(item.price_at_purchase * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between px-5 py-3 border-t border-[#EFEDE6] bg-[#FAFAF8]">
                                <div className="flex items-center gap-4">
                                    <Link
                                        to={`/orders/${order.id}`}
                                        className="text-sm text-[#2F5233] font-medium underline underline-offset-2"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    {order.status === "pending" && (
                                        <button
                                            onClick={() => handleCancel(order.id)}
                                            disabled={cancellingId === order.id}
                                            className="text-sm text-[#B3413B] font-medium underline underline-offset-2 disabled:opacity-60"
                                        >
                                            {cancellingId === order.id ? "Đang huỷ..." : "Huỷ đơn"}
                                        </button>
                                    )}
                                </div>
                                <div className="text-sm text-[#6B6F63]">
                                    Tổng tiền:{" "}
                                    <span style={fraunces} className="text-xl text-[#1F2420]">
                                        {formatVND(order.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OrderHistory;
