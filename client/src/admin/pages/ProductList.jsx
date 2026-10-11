import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAllProducts, toggleProductStatus, adjustStock } from "../api/adminProducts";

export default function ProductList() {
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getAllProducts(token);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleToggleStatus = async (product) => {
        try {
            const res = await toggleProductStatus(product.id, !product.is_active, token);
            setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? res.product : p))
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const handleQuickStockAdjust = async (product, type) => {
        const quantity = prompt(
            `Nhập số lượng muốn ${type === "add" ? "cộng thêm" : "trừ bớt"} cho "${product.name}":`
        );
        if (!quantity || isNaN(quantity)) return;

        try {
            const updated = await adjustStock(product.id, type, Number(quantity), token);
            setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? updated : p))
            );
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm max-w-lg">
                Lỗi: {error}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2
                    className="text-2xl text-[#1A1A18]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                >
                    Sản phẩm
                </h2>
                <Link
                    to="/admin/products/new"
                    className="rounded-md bg-[#2F5233] text-[#F5F3EE] px-4 py-2 text-sm font-medium hover:bg-[#274529] transition-colors"
                >
                    + Thêm sản phẩm
                </Link>
            </div>

            <div className="rounded-md border border-[#E5E3DC] bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-[#E5E3DC] bg-[#FAFAF8] text-left text-[#6B6B65]">
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Tên</th>
                        <th className="px-4 py-3 font-medium">Giá</th>
                        <th className="px-4 py-3 font-medium">Tồn kho</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 font-medium text-right">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((p) => (
                        <tr
                            key={p.id}
                            className={`border-b border-[#EFEDE6] last:border-0 text-[#1A1A18] ${
                                p.is_active ? "" : "opacity-50"
                            }`}
                        >
                            <td className="px-4 py-3">#{p.id}</td>
                            <td className="px-4 py-3">{p.name}</td>
                            <td className="px-4 py-3">
                                {Number(p.price).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span>{p.stock}</span>
                                    <button
                                        onClick={() => handleQuickStockAdjust(p, "add")}
                                        className="w-6 h-6 rounded border border-[#D9D6CC] text-[#2F5233] hover:bg-[#EFEDE6] leading-none"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => handleQuickStockAdjust(p, "subtract")}
                                        className="w-6 h-6 rounded border border-[#D9D6CC] text-[#B3413B] hover:bg-[#EFEDE6] leading-none"
                                    >
                                        -
                                    </button>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            p.is_active
                                                ? "bg-[#E5EEE0] text-[#2F5233]"
                                                : "bg-[#EFEDE6] text-[#6B6B65]"
                                        }`}
                                    >
                                        {p.is_active ? "Đang bán" : "Đã ẩn"}
                                    </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Link
                                    to={`/admin/products/${p.id}/edit`}
                                    className="text-[#2F5233] font-medium underline underline-offset-2 mr-4"
                                >
                                    Sửa
                                </Link>
                                <button
                                    onClick={() => handleToggleStatus(p)}
                                    className="text-[#6B6B65] font-medium underline underline-offset-2"
                                >
                                    {p.is_active ? "Ẩn" : "Hiện"}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan="6" className="px-4 py-10 text-center text-[#6B6B65]">
                                Chưa có sản phẩm nào
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}