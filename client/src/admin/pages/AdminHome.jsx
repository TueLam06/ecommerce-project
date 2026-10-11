import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../api/http";
import DailyChart from "../components/DailyChart";

export default function AdminHome() {
    const { token } = useAuth();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let ignore = false;

        async function fetchStats() {
            try {
                setLoading(true);

                const data = await authFetch("/api/admin/stats", {
                    token,
                });

                if (!ignore) setStats(data);
            } catch (err) {
                if (!ignore) setError(err.message);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        if (token) {
            fetchStats();
        }

        return () => {
            ignore = true;
        };
    }, [token]);

    const cards = [
        {
            label: "Tổng doanh thu",
            value: stats ? formatCurrency(stats.totalRevenue) : null,
            hint: stats ? `Hôm nay: ${formatCurrency(stats.todayRevenue)}` : null,
        },
        {
            label: "Đơn hàng mới",
            value: stats ? stats.newOrders : null,
        },
        {
            label: "Đơn chờ xử lý",
            value: stats ? stats.pendingOrders : null,
        },
        {
            label: "Sản phẩm đang bán",
            value: stats ? stats.activeProducts : null,
        },
    ];

    return (
        <div>
            <h2
                className="text-2xl text-[#1A1A18] mb-1"
                style={{ fontFamily: "'Fraunces', serif" }}
            >
                Tổng quan
            </h2>
            <p className="text-[#6B6B65] mb-8">Chọn một mục để bắt đầu quản lý.</p>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-md border border-[#D9D6CC] bg-white p-4"
                    >
                        <p className="text-sm text-[#6B6B65] mb-1">{card.label}</p>
                        {loading ? (
                            <div className="h-6 w-16 bg-[#EDEBE3] rounded animate-pulse" />
                        ) : error ? (
                            <p className="text-sm text-[#B3261E]">—</p>
                        ) : (
                            <p
                                className="text-xl text-[#1A1A18]"
                                style={{ fontFamily: "'Fraunces', serif" }}
                            >
                                {card.value}
                            </p>
                        )}
                        {!loading && !error && card.hint && (
                            <p className="text-xs text-[#8A8A82] mt-1">{card.hint}</p>
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <p className="text-sm text-[#B3261E] mb-4">
                    Không tải được dữ liệu tổng quan: {error}
                </p>
            )}

            {/* Biểu đồ doanh thu / đơn hàng theo ngày */}
            {loading ? (
                <div className="h-72 rounded-md border border-[#D9D6CC] bg-white mb-8 animate-pulse" />
            ) : (
                stats?.daily && (
                    <div className="mb-8">
                        <DailyChart data={stats.daily} />
                    </div>
                )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <Link
                    to="/admin/products"
                    className="rounded-md border border-[#D9D6CC] bg-white p-5 hover:border-[#2F5233] transition-colors"
                >
                    <h3 className="text-[#1A1A18] font-medium mb-1">Sản phẩm</h3>
                    <p className="text-sm text-[#6B6B65]">
                        Thêm, sửa, ẩn/hiện, điều chỉnh tồn kho
                    </p>
                </Link>
                <Link
                    to="/admin/orders"
                    className="rounded-md border border-[#D9D6CC] bg-white p-5 hover:border-[#2F5233] transition-colors"
                >
                    <h3 className="text-[#1A1A18] font-medium mb-1">Đơn hàng</h3>
                    <p className="text-sm text-[#6B6B65]">
                        Xem danh sách, cập nhật trạng thái, doanh thu
                    </p>
                </Link>
            </div>
        </div>
    );
}

function formatCurrency(value) {
    if (value == null) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}