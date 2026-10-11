import { useState, useEffect, useRef, useCallback } from "react";
import { CartContext } from "./CartContext";
import { useAuth } from "./AuthContext";

const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const CART_API = `${API_BASE}/api/cart`;

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
            const res = await fetch(CART_API, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const data = await res.json();
            if (res.ok) {
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
            }
        } catch (err) {
            console.error("Lỗi tải giỏ hàng:", err);
        }
    }, []);

    // Đẩy toàn bộ cart local lên DB (gọi 1 lần lúc vừa đăng nhập)
    const mergeLocalCartToServer = useCallback(async (localCart, authToken) => {
        for (const item of localCart) {
            try {
                await fetch(CART_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ product_id: item.id, quantity: item.quantity }),
                });
            } catch (err) {
                console.error("Lỗi merge cart:", err);
            }
        }
        localStorage.removeItem("cart");
    }, []);

    // Theo dõi lúc login/logout để merge + đồng bộ
    const prevTokenRef = useRef(token);
    useEffect(() => {
        const justLoggedIn = !prevTokenRef.current && token;
        const justLoggedOut = prevTokenRef.current && !token;
        prevTokenRef.current = token;

        if (justLoggedIn) {
            (async () => {
                setLoading(true);
                const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
                if (localCart.length > 0) {
                    await mergeLocalCartToServer(localCart, token);
                }
                await fetchCart(token);
                setLoading(false);
            })();
        } else if (justLoggedOut) {
            setCart([]); // logout: không giữ cart của user cũ, khách vãng lai bắt đầu giỏ trống
        } else if (token) {
            // F5 lúc đã đăng nhập sẵn (token có ngay từ đầu, không qua "vừa login")
            fetchCart(token);
        }
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
            const res = await fetch(CART_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ product_id: product.id, quantity: 1 }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || "Không thêm được vào giỏ hàng");
                return;
            }
            await fetchCart(token);
            showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối, thử lại sau");
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
            const res = await fetch(`${CART_API}/${product.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ quantity: existing.quantity + 1 }),
            });
            if (res.ok) await fetchCart(token);
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
            const res = await fetch(`${CART_API}/${product.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ quantity: existing.quantity - 1 }),
            });
            if (res.ok) await fetchCart(token);
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
            const res = await fetch(`${CART_API}/${product.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) await fetchCart(token);
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
            await fetch(CART_API, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
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