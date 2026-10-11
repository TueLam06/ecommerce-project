import { authFetch } from "../../api/http";

export const getAllProducts = (token) =>
    authFetch("/api/admin/products", { token });

export const getProductById = (id, token) =>
    authFetch(`/api/admin/products/${id}`, { token });

export const createProduct = (data, token) =>
    authFetch("/api/admin/products", { method: "POST", body: data, token });

export const updateProduct = (id, data, token) =>
    authFetch(`/api/admin/products/${id}`, { method: "PUT", body: data, token });

export const adjustStock = (id, type, quantity, token) =>
    authFetch(`/api/admin/products/${id}/stock`, {
        method: "PATCH",
        body: { type, quantity },
        token,
    });

export const toggleProductStatus = (id, is_active, token) =>
    authFetch(`/api/admin/products/${id}/status`, {
        method: "PATCH",
        body: { is_active },
        token,
    });