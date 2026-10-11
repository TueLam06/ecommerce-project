import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

function ProductDetail() {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Không tìm thấy sản phẩm");
                }
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FAFAF8]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <p className="text-[#6B6B65]">Đang tải sản phẩm...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-[#FAFAF8]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="rounded-lg border border-[#E3C6C3] bg-[#FBF1F0] p-6">
                        <p className="text-[#B3413B]">Lỗi: {error}</p>

                        <Link
                            to="/products"
                            className="mt-4 inline-block text-[#2F5233] font-medium hover:underline"
                        >
                            ← Quay lại sản phẩm
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAFAF8]">
            <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">

                {/* Breadcrumb */}
                <div className="mb-8 text-sm text-[#6B6B65]">
                    <Link
                        to="/products"
                        className="hover:text-[#2F5233]"
                    >
                        Products
                    </Link>

                    <span className="mx-2">/</span>

                    <span>{product.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">

                    {/* Product image */}
                    <div className="overflow-hidden rounded-lg border border-[#D9D6CC] bg-white">
                        {product.image && (
                            <div className="aspect-square bg-[#F5F3EE]">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* Product information */}
                    <div className="flex flex-col justify-center">

                        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[#6B6B65]">
                            {product.category}
                        </p>

                        <h1
                            className="mb-4 text-4xl font-semibold leading-tight text-[#1A1A18] md:text-5xl"
                            style={{ fontFamily: "'Fraunces', serif" }}
                        >
                            {product.name}
                        </h1>

                        <p className="mb-6 text-2xl font-medium text-[#2F5233]">
                            {Number(product.price).toLocaleString("vi-VN")}₫
                        </p>

                        <div className="mb-8 border-y border-[#D9D6CC] py-6">
                            <p className="mb-2 text-sm font-medium text-[#1A1A18]">
                                Mô tả
                            </p>

                            <p className="leading-7 text-[#6B6B65] whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm text-[#6B6B65]">
                                Còn lại:{" "}
                                <span className="font-medium text-[#1A1A18]">
                                    {product.stock}
                                </span>
                            </p>
                        </div>

                        <button
                            onClick={() => addToCart(product)}
                            className="w-full rounded-md bg-[#2F5233] px-6 py-3.5 font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027]"
                        >
                            Thêm vào giỏ hàng
                        </button>

                        <Link
                            to="/products"
                            className="mt-4 text-center text-sm font-medium text-[#6B6B65] hover:text-[#2F5233]"
                        >
                            ← Quay lại
                        </Link>

                    </div>
                </div>
            </section>
        </main>
    );
}

export default ProductDetail;