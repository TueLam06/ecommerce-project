import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrderById, cancelMyOrder } from "../api/orders";
import { STATUS_LABELS, STATUS_BADGE } from "../constants/orderStatus";
import OrderDetailView from "../components/OrderDetailView";

const fraunces = { fontFamily: "'Fraunces', serif" };
const inter = { fontFamily: "'Inter', sans-serif" };

function MyOrderDetail() {
    const { id } = useParams();
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async () => {
        if (!window.confirm(`Huỷ đơn hàng #${order.id}?`)) return;
        setCancelling(true);
        try {
            const updated = await cancelMyOrder(order.id, token);
            setOrder((prev) => ({ ...prev, status: updated.status }));
        } catch (err) {
            alert(err.message || "Lỗi huỷ đơn hàng");
        } finally {
            setCancelling(false);
        }
    };

    useEffect(() => {
        getMyOrderById(id, token)
            .then(setOrder)
            .catch((err) => setError(err.message || "Lỗi tải chi tiết đơn hàng"))
            .finally(() => setLoading(false));
    }, [id, token]);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12" style={inter}>
                <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm mb-6">
                    Lỗi: {error || "Không tìm thấy đơn hàng"}
                </div>
                <Link to="/orders" className="text-sm text-[#2F5233] underline underline-offset-2">
                    ← Về lịch sử đơn hàng
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8] px-6 py-12">
            <div className="max-w-4xl mx-auto" style={inter}>
                <Link to="/orders" className="text-sm text-[#6B6F63] hover:text-[#1F2420]">
                    ← Về lịch sử đơn hàng
                </Link>

                <div className="flex flex-wrap items-center gap-3 mt-4 mb-8">
                    <h1 style={fraunces} className="text-3xl text-[#1F2420]">
                        Đơn hàng #{order.id}
                    </h1>
                    <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[order.status] || ""}`}
                    >
                        {STATUS_LABELS[order.status] || order.status}
                    </span>
                    {order.status === "pending" && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="ml-auto px-4 py-2 text-sm border border-[#B3413B] text-[#B3413B] rounded-sm hover:bg-[#FBF1F0] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {cancelling ? "Đang huỷ..." : "Huỷ đơn hàng"}
                        </button>
                    )}
                </div>

                <OrderDetailView order={order} />
            </div>
        </div>
    );
}

export default MyOrderDetail;
