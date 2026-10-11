import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../constants/orderStatus";

const fraunces = { fontFamily: "'Fraunces', serif" };

function formatVND(n) {
    return Number(n).toLocaleString("vi-VN") + "đ";
}

// Các bước hiển thị tiến trình đơn (đơn bị hủy thì không hiện tiến trình)
const STEPS = ["pending", "confirmed", "shipping", "completed"];

// Tiến trình + thông tin giao hàng + danh sách sản phẩm của 1 đơn
// Dùng chung cho trang đơn của user (MyOrderDetail) và trang tra cứu (TrackOrder)
function OrderDetailView({ order }) {
    const currentStep = STEPS.indexOf(order.status);

    return (
        <>
            {currentStep >= 0 && (
                <div className="rounded-md border border-[#E5E3DC] bg-white px-6 py-5 mb-6">
                    <div className="flex items-center">
                        {STEPS.map((step, i) => (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                            i <= currentStep
                                                ? "bg-[#2F5233] text-[#F5F3EE]"
                                                : "bg-[#EFEDE6] text-[#6B6F63]"
                                        }`}
                                    >
                                        {i < currentStep ? "✓" : i + 1}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs text-center whitespace-nowrap ${
                                            i <= currentStep ? "text-[#1F2420]" : "text-[#6B6F63]"
                                        }`}
                                    >
                                        {STATUS_LABELS[step]}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-2 mb-6 ${
                                            i < currentStep ? "bg-[#2F5233]" : "bg-[#EFEDE6]"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-md border border-[#E5E3DC] bg-white p-6 mb-6">
                <h2 style={fraunces} className="text-lg text-[#1F2420] mb-4">
                    Thông tin giao hàng
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[#6B6F63] mb-1">Người nhận</p>
                        <p className="text-[#1F2420] font-medium">{order.customer_name}</p>
                    </div>
                    <div>
                        <p className="text-[#6B6F63] mb-1">Số điện thoại</p>
                        <p className="text-[#1F2420] font-medium">{order.phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-[#6B6F63] mb-1">Địa chỉ</p>
                        <p className="text-[#1F2420] font-medium">{order.address}</p>
                    </div>
                    <div>
                        <p className="text-[#6B6F63] mb-1">Ngày đặt</p>
                        <p className="text-[#1F2420] font-medium">
                            {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-[#E5E3DC] bg-white">
                <h2 style={fraunces} className="text-lg text-[#1F2420] px-6 pt-5 pb-2">
                    Sản phẩm
                </h2>
                <div className="px-6 divide-y divide-[#EFEDE6]">
                    {order.items.map((item) => {
                        const canLink = item.product_id !== null && item.product_is_active;
                        const name = canLink ? (
                            <Link to={`/products/${item.product_id}`} className="hover:text-[#2F5233]">
                                {item.product_name}
                            </Link>
                        ) : (
                            item.product_name
                        );
                        return (
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
                                    <div className="text-[15px] text-[#1F2420]">
                                        {name}
                                        {!canLink && (
                                            <span className="text-[#6B6F63] italic text-sm"> (ngừng kinh doanh)</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-[#6B6F63]">
                                        {formatVND(item.price_at_purchase)} × {item.quantity}
                                    </div>
                                </div>
                                <div className="text-[15px] text-[#1F2420] whitespace-nowrap">
                                    {formatVND(item.price_at_purchase * item.quantity)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-baseline justify-between px-6 py-4 border-t border-[#EFEDE6] bg-[#FAFAF8]">
                    <span className="text-sm text-[#6B6F63]">Tổng cộng</span>
                    <span style={fraunces} className="text-2xl text-[#1F2420]">
                        {formatVND(order.total)}
                    </span>
                </div>
            </div>
        </>
    );
}

export default OrderDetailView;
