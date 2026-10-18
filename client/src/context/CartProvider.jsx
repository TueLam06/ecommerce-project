import { useState, useEffect, useRef, useCallback } from "react";
import { CartContext } from "./CartContext";
import { useAuth } from "./AuthContext";
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCartRequest } from "../api/cart";

export function CartProvider({ children }) {
    const { token } = useAuth();

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [loading, setLoading] = useState(false);

    // Nhiều thông báo xếp chồng, mỗi cái tự tắt theo timer riêng
    const [toasts, setToasts] = useState([]);
    const toastTimersRef = useRef(new Map());
    const toastIdRef = useRef(0);

    function showToast(message) {
        const id = ++toastIdRef.current;
        // Giữ tối đa 5 thông báo, cái cũ nhất bị đẩy ra
        setToasts((prev) => [...prev, { id, message }].slice(-5));
        const timer = setTimeout(() => {
            toastTimersRef.current.delete(id);
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
        toastTimersRef.current.set(id, timer);
    }

    useEffect(() => {
        const timers = toastTimersRef.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    // Khách vãng lai (chưa đăng nhập): vẫn lưu localStorage như cũ
    useEffect(() => {
        if (!token) {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart, token]);

    // Lấy cart từ DB, chuẩn hoá product_id -> id để phần còn lại của app (CartPage, Checkout...) không cần sửa
    // Một dòng giỏ = (id, variant_id); variant_id null nếu sản phẩm không có phiên bản
    const fetchCart = useCallback(async (authToken) => {
        try {
            const data = await getCart(authToken);
            setCart(
                data.map((item) => ({
                    id: item.product_id,
                    variant_id: item.variant_id ?? null,
                    variant_name: item.variant_name ?? null,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    stock: item.stock,
                    quantity: item.quantity,
                }))
            );
        } catch (err) {
            console.error("Lỗi tải giỏ hàng:", err);
        }
    }, []);

    // Đẩy toàn bộ cart local lên DB (gọi 1 lần lúc vừa đăng nhập)
    const mergeLocalCartToServer = useCallback(async (localCart, authToken) => {
        for (const item of localCart) {
            try {
                await addCartItem(item.id, item.variant_id ?? null, item.quantity, authToken);
            } catch (err) {
                console.error("Lỗi merge cart:", err);
            }
        }
        localStorage.removeItem("cart");
    }, []);

    // Token vừa đổi: cập nhật state ngay trong lúc render (cách React khuyên thay cho setState trong effect)
    const [prevToken, setPrevToken] = useState(token);
    if (token !== prevToken) {
        setPrevToken(token);
        if (!token) {
            setCart([]); // logout: không giữ cart của user cũ, khách vãng lai bắt đầu giỏ trống
        } else if (!prevToken) {
            setLoading(true); // vừa login: chờ merge + tải cart từ DB
        }
    }

    // Đồng bộ cart với DB khi vừa login (merge cart local lên) hoặc F5 lúc đã đăng nhập sẵn
    const prevTokenRef = useRef(token);
    useEffect(() => {
        const justLoggedIn = !prevTokenRef.current && token;
        prevTokenRef.current = token;
        if (!token) return;

        (async () => {
            if (justLoggedIn) {
                const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
                if (localCart.length > 0) {
                    await mergeLocalCartToServer(localCart, token);
                }
            }
            await fetchCart(token);
            if (justLoggedIn) setLoading(false);
        })();
    }, [token, fetchCart, mergeLocalCartToServer]);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const formattedTotal = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(total);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Hai dòng giỏ là một khi cùng sản phẩm và cùng phiên bản (variant_id null = không có phiên bản)
    const sameLine = (a, b) => a.id === b.id && (a.variant_id ?? null) === (b.variant_id ?? null);

    // variant: phiên bản đã chọn ({ id, name, price, stock, image }), bỏ trống với sản phẩm không có phiên bản
    async function addToCart(product, variant = null) {
        const line = {
            id: product.id,
            variant_id: variant ? variant.id : null,
            variant_name: variant ? variant.name : null,
            name: product.name,
            price: variant ? variant.price : product.price,
            image: variant?.image || product.image,
            stock: variant ? variant.stock : product.stock,
        };

        if (!token) {
            setCart((prev) => {
                const existing = prev.find((item) => sameLine(item, line));
                if (existing) {
                    return prev.map((item) =>
                        sameLine(item, line) ? { ...item, quantity: item.quantity + 1 } : item
                    );
                }
                return [...prev, { ...line, quantity: 1 }];
            });
            showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
            return;
        }

        try {
            await addCartItem(line.id, line.variant_id, 1, token);
            await fetchCart(token);
            showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Không thêm được vào giỏ hàng");
        }
    }

    // increase/decrease/remove nhận 1 dòng giỏ hàng (item trong cart)
    async function increaseQuantity(line) {
        const existing = cart.find((item) => sameLine(item, line));
        if (!existing) return;

        if (!token) {
            setCart((prev) =>
                prev.map((item) => (sameLine(item, line) ? { ...item, quantity: item.quantity + 1 } : item))
            );
            return;
        }

        try {
            await updateCartItem(line.id, existing.variant_id, existing.quantity + 1, token);
            await fetchCart(token);
        } catch (err) {
            console.error(err);
        }
    }

    async function decreaseQuantity(line) {
        const existing = cart.find((item) => sameLine(item, line));
        if (!existing) return;

        if (existing.quantity <= 1) {
            return removeFromCart(line);
        }

        if (!token) {
            setCart((prev) =>
                prev.map((item) => (sameLine(item, line) ? { ...item, quantity: item.quantity - 1 } : item))
            );
            return;
        }

        try {
            await updateCartItem(line.id, existing.variant_id, existing.quantity - 1, token);
            await fetchCart(token);
        } catch (err) {
            console.error(err);
        }
    }

    async function removeFromCart(line) {
        if (!token) {
            setCart((prev) => prev.filter((item) => !sameLine(item, line)));
            return;
        }

        try {
            await removeCartItem(line.id, line.variant_id ?? null, token);
            await fetchCart(token);
        } catch (err) {
            console.error(err);
        }
    }

    async function clearCart() {
        if (!token) {
            setCart([]);
            localStorage.removeItem("cart");
            return;
        }

        try {
            await clearCartRequest(token);
        } catch (err) {
            console.error(err);
        } finally {
            setCart([]);
        }
    }

    const value = {
        cart,
        total,
        cartCount,
        loading,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        formattedTotal,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="toast-in max-w-xs rounded-md bg-[#2F5233] text-[#F5F3EE] px-5 py-3 shadow-lg text-sm font-medium"
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </CartContext.Provider>
    );
}