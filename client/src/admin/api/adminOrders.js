import { authFetch } from "../../api/http";

export const getAllOrders = (token, status) => {
    const query = status ? `?status=${status}` : "";
    return authFetch(`/api/admin/orders${query}`, { token });
};

export const getOrderById = (id, token) =>
    authFetch(`/api/admin/orders/${id}`, { token });

export const updateOrderStatus = (id, status, token) =>
    authFetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: { status },
        token,
    });

export const deleteOrder = (id, token) =>
    authFetch(`/api/admin/orders/${id}`, { method: "DELETE", token });

export const getRevenueStats = (token) =>
    authFetch("/api/admin/orders/stats/revenue", { token });