import { Link } from "react-router-dom";

function formatVND(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);
}

function Cart({cart, total, onIncrease, onDecrease, onRemove,}) {
    return (
        <div className="w-full">
            {/* Title */}
            <div className="mb-8">
                <h1
                    className="text-3xl text-[#1A1A18]"
                    style={{
                        fontFamily: "'Fraunces', serif",
                    }}
                >
                    Shopping Cart
                </h1>

                <p className="mt-2 text-sm text-[#6B6B65]">
                    {cart.length} sản phẩm trong giỏ hàng
                </p>
            </div>

            {cart.length === 0 ? (
                /* Empty cart */
                <div className="rounded-lg border border-[#D9D6CC] bg-white px-6 py-16 text-center">
                    <h2
                        className="text-2xl text-[#1A1A18]"
                        style={{
                            fontFamily: "'Fraunces', serif",
                        }}
                    >
                        Giỏ hàng đang trống
                    </h2>

                    <p className="mt-2 text-sm text-[#6B6B65]">
                        Hãy thêm một vài sản phẩm trước khi thanh toán.
                    </p>

                    <Link
                        to="/products"
                        className="mt-6 inline-block rounded-md bg-[#2F5233] px-5 py-2.5 text-sm font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027]"
                    >
                        Xem sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    {/* Product list */}
                    <div className="rounded-lg border border-[#D9D6CC] bg-white">
                        {cart.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                                    index !== cart.length - 1
                                        ? "border-b border-[#D9D6CC]"
                                        : ""
                                }`}
                            >
                                {/* Product info */}
                                <div className="min-w-0">
                                    <h3 className="font-medium text-[#1A1A18]">
                                        {item.name}
                                    </h3>

                                    <p className="mt-1 text-sm text-[#6B6B65]">
                                        {formatVND(item.price)} / sản phẩm
                                    </p>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center rounded-md border border-[#D9D6CC]">
                                        <button
                                            onClick={() =>
                                                onDecrease(item)
                                            }
                                            className="flex h-9 w-9 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#F5F3EE]"
                                            aria-label="Giảm số lượng"
                                        >
                                            −
                                        </button>

                                        <span className="flex h-9 min-w-9 items-center justify-center border-x border-[#D9D6CC] px-2 text-sm text-[#1A1A18]">
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                onIncrease(item)
                                            }
                                            className="flex h-9 w-9 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#F5F3EE]"
                                            aria-label="Tăng số lượng"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() =>
                                            onRemove(item)
                                        }
                                        className="text-sm text-[#6B6B65] transition-colors hover:text-[#B3413B]"
                                    >
                                        Xóa khỏi giỏ hàng
                                    </button>
                                </div>

                                {/* Item total */}
                                <div className="text-sm font-medium text-[#2F5233] sm:min-w-[80px] sm:text-right">
                                    {formatVND(item.price * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="h-fit rounded-lg border border-[#D9D6CC] bg-white p-5">
                        <h2
                            className="text-xl text-[#1A1A18]"
                            style={{
                                fontFamily: "'Fraunces', serif",
                            }}
                        >
                            Đơn giá
                        </h2>

                        <div className="mt-5 flex items-center justify-between border-b border-[#D9D6CC] pb-4">
                            <span className="text-sm text-[#6B6B65]">
                                Tổng
                            </span>

                            <span className="font-medium text-[#1A1A18]">
                                {total}
                            </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="font-medium text-[#1A1A18]">
                                Thành tiền
                            </span>

                            <span className="text-lg font-medium text-[#2F5233]">
                                {total}
                            </span>
                        </div>

                        <Link
                            to="/checkout"
                            className="mt-6 block w-full rounded-md bg-[#2F5233] px-5 py-3 text-center text-sm font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027]"
                        >
                            Đến trang thanh toán
                        </Link>

                        <Link
                            to="/products"
                            className="mt-3 block text-center text-sm text-[#6B6B65] transition-colors hover:text-[#2F5233]"
                        >
                            ← Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;

