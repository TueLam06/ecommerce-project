import { authFetch } from "./http";

export const getCart = (token) => authFetch("/api/cart", { token });

// variantId = null với sản phẩm không có phiên bản
export const addCartItem = (productId, variantId, quantity, token) =>
    authFetch("/api/cart", {
        method: "POST",
        body: { product_id: productId, variant_id: variantId, quantity },
        token,
    });

export const updateCartItem = (productId, variantId, quantity, token) =>
    authFetch(`/api/cart/${productId}`, { method: "PUT", body: { quantity, variant_id: variantId }, token });

export const removeCartItem = (productId, variantId, token) =>
    authFetch(`/api/cart/${productId}${variantId ? `?variant_id=${variantId}` : ""}`, { method: "DELETE", token });

export const clearCartRequest = (token) => authFetch("/api/cart", { method: "DELETE", token });
