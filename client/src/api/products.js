import { authFetch } from "./http";

// params: { sort, order, category } — bỏ trống thì lấy tất cả
export const getProducts = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/api/products${query ? `?${query}` : ""}`);
};

export const getProductById = (id) => authFetch(`/api/products/${id}`);

export const getCategories = () => authFetch("/api/categories");
