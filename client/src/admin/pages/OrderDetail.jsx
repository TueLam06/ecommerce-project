import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrderById, updateOrderStatus } from "../api/adminOrders";

const STATUS_LABELS = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Đã giao thành công",
    cancelled: "Đã hủy",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
// Đơn đã kết thúc: không đổi trạng thái được nữa
const FINAL_STATUSES = ["completed", "cancelled"];

const STATUS_BADGE = {
    pending: "bg-[#FBF1DF] text-[#8A6D1D]",
    confirmed: "bg-[#E7EEF7] text-[#2F5A8A]",
    shipping: "bg-[#EAE7F7] text-[#5A3E9E]",
    completed: "bg-[#E5EEE0] text-[#2F5233]",
    cancelled: "bg-[#FBF1F0] text-[#B3413B]",
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getOrderById(id, token);
                setOrder(data);
            } catch (err) {
                setError(err.message || "Lỗi tải chi tiết đơn hàng");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, token]);

    const handleStatusChange = async (newStatus) => {
        if (
            newStatus === "cancelled" &&
            !window.confirm(`Huỷ đơn hàng #${id}? Đơn đã huỷ sẽ không thể đổi trạng thái lại.`)
        ) {
            return;
        }
        if (
            newStatus === "completed" &&
            !window.confirm(`Xác nhận đơn hàng #${id} đã giao thành công? Sau đó sẽ không thể đổi trạng thái lại.`)
        ) {
            return;
        }
        setSaving(true);
        try {
            await updateOrderStatus(id, newStatus, token);
            setOrder((prev) => ({ ...prev, status: newStatus }));
        } catch (err) {
            alert(err.message || "Lỗi cập nhật trạng thái");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm max-w-lg">
                Lỗi: {error}
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-4xl">
            <button
                onClick={() => navigate(-1)}
                className="text-sm text-[#6B6B65] hover:text-[#1A1A18] mb-4"
            >
                ← Quay lại
            </button>

            <h2
                className="text-2xl text-[#1A1A18] mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
            >
                Đơn hàng #{order.id}
            </h2>

            <div className="rounded-md border border-[#E5E3DC] bg-white p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[#6B6B65] mb-1">Khách hàng</p>
                        <p className="text-[#1A1A18] font-medium">{order.customer_name}</p>
                    </div>
                    <div>
                        <p className="text-[#6B6B65] mb-1">SĐT</p>
                        <p className="text-[#1A1A18] font-medium">{order.phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-[#6B6B65] mb-1">Địa chỉ</p>
                        <p className="text-[#1A1A18] font-medium">{order.address}</p>
                    </div>
                    <div>
                        <p className="text-[#6B6B65] mb-1">Tổng tiền</p>
                        <p className="text-[#1A1A18] font-medium">
                            {Number(order.total).toLocaleString("vi-VN")}đ
                        </p>
                    </div>
                    <div>
                        <p className="text-[#6B6B65] mb-1">Ngày đặt</p>
                        <p className="text-[#1A1A18] font-medium">
                            {order.created_at
                                ? new Date(order.created_at).toLocaleString("vi-VN")
                                : ""}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#6B6B65] mb-1">Trạng thái</p>
                        {FINAL_STATUSES.includes(order.status) ? (
                            <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[order.status]}`}
                            >
                                {STATUS_LABELS[order.status]}
                            </span>
                        ) : (
                            <select
                                value={order.status}
                                disabled={saving}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="rounded-md border border-[#D9D6CC] bg-white px-3 py-2 text-sm text-[#1A1A18] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <h3 className="text-lg text-[#1A1A18] mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                Sản phẩm trong đơn
            </h3>

            <div className="rounded-md border border-[#E5E3DC] bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-[#E5E3DC] bg-[#FAFAF8] text-left text-[#6B6B65]">
                        <th className="px-4 py-3 font-medium">Ảnh</th>
                        <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
                        <th className="px-4 py-3 font-medium">Số lượng</th>
                        <th className="px-4 py-3 font-medium">Đơn giá</th>
                        <th className="px-4 py-3 font-medium text-right">Thành tiền</th>
                    </tr>
                    </thead>
                    <tbody>
                    {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-[#EFEDE6] last:border-0">
                            <td className="px-4 py-3">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.product_name}
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                ) : (
                                    <span className="text-[#6B6B65]">—</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-[#1A1A18]">
                                {item.product_name}
                                {item.product_id === null && (
                                    <span className="text-[#6B6B65] italic"> (đã xóa)</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-[#1A1A18]">{item.quantity}</td>
                            <td className="px-4 py-3 text-[#1A1A18]">
                                {Number(item.price_at_purchase).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-4 py-3 text-right text-[#1A1A18] font-medium">
                                {(item.quantity * item.price_at_purchase).toLocaleString("vi-VN")}đ
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}