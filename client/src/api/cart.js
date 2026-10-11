import { authFetch } from "./http";

export const getCart = (token) => authFetch("/api/cart", { token });

export const addCartItem = (productId, quantity, token) =>
    authFetch("/api/cart", { method: "POST", body: { product_id: productId, quantity }, token });

export const updateCartItem = (productId, quantity, token) =>
    authFetch(`/api/cart/${productId}`, { method: "PUT", body: { quantity }, token });

export const removeCartItem = (productId, token) =>
    authFetch(`/api/cart/${productId}`, { method: "DELETE", token });

export const clearCartRequest = (token) => authFetch("/api/cart", { method: "DELETE", token });
