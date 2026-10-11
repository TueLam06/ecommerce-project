import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllOrders, updateOrderStatus, deleteOrder } from "../api/adminOrders";

const STATUS_LABELS = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Đã giao thành công",
    cancelled: "Đã hủy",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
// Đơn đã kết thúc: không đổi trạng thái được nữa, và được phép xoá
const FINAL_STATUSES = ["completed", "cancelled"];
const DELETABLE_STATUSES = FINAL_STATUSES;

const STATUS_BADGE = {
    pending: "bg-[#FBF1DF] text-[#8A6D1D]",
    confirmed: "bg-[#E7EEF7] text-[#2F5A8A]",
    shipping: "bg-[#EAE7F7] text-[#5A3E9E]",
    completed: "bg-[#E5EEE0] text-[#2F5233]",
    cancelled: "bg-[#FBF1F0] text-[#B3413B]",
};

export default function OrderList() {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAllOrders(token, filterStatus || undefined);
            setOrders(data);
        } catch (err) {
            setError(err.message || "Lỗi tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const handleStatusChange = async (id, newStatus) => {
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
        try {
            await updateOrderStatus(id, newStatus, token);
            setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
            );
        } catch (err) {
            alert(err.message || "Lỗi cập nhật trạng thái");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Xóa đơn hàng #${id}? Hành động này không thể hoàn tác.`)) {
            return;
        }
        try {
            await deleteOrder(id, token);
            setOrders((prev) => prev.filter((o) => o.id !== id));
        } catch (err) {
            alert(err.message || "Lỗi xóa đơn hàng");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2
                    className="text-2xl text-[#1A1A18]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                >
                    Đơn hàng
                </h2>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-md border border-[#D9D6CC] bg-white px-3 py-2 text-sm text-[#1A1A18]"
                >
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
            </div>

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

            {!loading && !error && (
                <div className="rounded-md border border-[#E5E3DC] bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#E5E3DC] bg-[#FAFAF8] text-left text-[#6B6B65]">
                            <th className="px-4 py-3 font-medium">ID</th>
                            <th className="px-4 py-3 font-medium">Khách hàng</th>
                            <th className="px-4 py-3 font-medium">SĐT</th>
                            <th className="px-4 py-3 font-medium">Tổng tiền</th>
                            <th className="px-4 py-3 font-medium">Trạng thái</th>
                            <th className="px-4 py-3 font-medium">Ngày đặt</th>
                            <th className="px-4 py-3 font-medium text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className="border-b border-[#EFEDE6] last:border-0 text-[#1A1A18]"
                            >
                                <td className="px-4 py-3">#{order.id}</td>
                                <td className="px-4 py-3">{order.customer_name}</td>
                                <td className="px-4 py-3 text-[#6B6B65]">{order.phone}</td>
                                <td className="px-4 py-3">
                                    {Number(order.total).toLocaleString("vi-VN")}đ
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[order.status]}`}
                                            >
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        {!FINAL_STATUSES.includes(order.status) && (
                                            <select
                                                value={order.status}
                                                onChange={(e) =>
                                                    handleStatusChange(order.id, e.target.value)
                                                }
                                                className="rounded border border-[#D9D6CC] bg-white text-xs px-2 py-1"
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_LABELS[s]}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[#6B6B65]">
                                    {order.created_at
                                        ? new Date(order.created_at).toLocaleString("vi-VN")
                                        : ""}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <Link
                                        to={`/admin/orders/${order.id}`}
                                        className="text-[#2F5233] font-medium underline underline-offset-2 mr-4"
                                    >
                                        Chi tiết
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(order.id)}
                                        disabled={!DELETABLE_STATUSES.includes(order.status)}
                                        title={
                                            DELETABLE_STATUSES.includes(order.status)
                                                ? undefined
                                                : "Chỉ xoá được đơn đã giao thành công hoặc đã huỷ"
                                        }
                                        className="text-[#B3413B] font-medium underline underline-offset-2 disabled:text-[#C9C6BD] disabled:no-underline disabled:cursor-not-allowed"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-4 py-10 text-center text-[#6B6B65]">
                                    Không có đơn hàng nào
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}