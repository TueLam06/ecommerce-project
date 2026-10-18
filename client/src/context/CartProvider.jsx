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

    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);

    function showToast(message) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(message);
        toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    }

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    // Khách vãng lai (chưa đăng nhập): vẫn lưu localStorage như cũ
    useEffect(() => {
        if (!token) {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart, token]);

    // Lấy cart từ DB, chuẩn hoá product_id -> id để phần còn lại của app (CartPage, Checkout...) không cần sửa
    const fetchCart = useCallback(async (authToken) => {
        try {
            const data = await getCart(authToken);
            setCart(
                data.map((item) => ({
                    id: item.product_id,
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
                await addCartItem(item.id, item.quantity, authToken);
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

    async function addToCart(product) {
        if (!token) {
            setCart((prev) => {
                const existing = prev.find((item) => item.id === product.id);
                if (existing) {
                    return prev.map((item) =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                }
                return [...prev, { ...product, quantity: 1 }];
            });
            showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
            return;
        }

        try {
            await addCartItem(product.id, 1, token);
            await fetchCart(token);
            showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Không thêm được vào giỏ hàng");
        }
    }

    async function increaseQuantity(product) {
        const existing = cart.find((item) => item.id === product.id);
        if (!existing) return addToCart(product);

        if (!token) {
            setCart((prev) =>
                prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
            );
            return;
        }

        try {
            await updateCartItem(product.id, existing.quantity + 1, token);
            await fetchCart(token);
        } catch (err) {
            console.error(err);
        }
    }

    async function decreaseQuantity(product) {
        const existing = cart.find((item) => item.id === product.id);
        if (!existing) return;

        if (existing.quantity <= 1) {
            return removeFromCart(product);
        }

        if (!token) {
            setCart((prev) =>
                prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item))
            );
            return;
        }

        try {
            await updateCartItem(product.id, existing.quantity - 1, token);
            await fetchCart(token);
        } catch (err) {
            console.error(err);
        }
    }

    async function removeFromCart(product) {
        if (!token) {
            setCart((prev) => prev.filter((item) => item.id !== product.id));
            return;
        }

        try {
            await removeCartItem(product.id, token);
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
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                    toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                }`}
            >
                <div className="rounded-md bg-[#2F5233] text-[#F5F3EE] px-5 py-3 shadow-lg text-sm font-medium">
                    {toast}
                </div>
            </div>
        </CartContext.Provider>
    );
}