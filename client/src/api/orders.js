import { authFetch } from "./http";

export const getMyOrders = (token) => authFetch("/api/orders/my", { token });

export const getMyOrderById = (id, token) =>
    authFetch(`/api/orders/my/${id}`, { token });

export const cancelMyOrder = (id, token) =>
    authFetch(`/api/orders/my/${id}/cancel`, { method: "PATCH", token });

// Khách không đăng nhập tra đơn bằng mã đơn + SĐT
export const trackOrder = (orderId, phone) =>
    authFetch("/api/orders/track", { method: "POST", body: { orderId, phone } });

// Đơn gần nhất khách vãng lai đặt trên máy này, để trang tra cứu điền sẵn
const LAST_GUEST_ORDER_KEY = "lastGuestOrder";

export function saveLastGuestOrder(orderId, phone) {
    try {
        localStorage.setItem(LAST_GUEST_ORDER_KEY, JSON.stringify({ orderId, phone }));
    } catch {
        // localStorage bị chặn thì bỏ qua, khách vẫn tra cứu tay được
    }
}

export function readLastGuestOrder() {
    try {
        return JSON.parse(localStorage.getItem(LAST_GUEST_ORDER_KEY)) || null;
    } catch {
        return null;
    }
}
