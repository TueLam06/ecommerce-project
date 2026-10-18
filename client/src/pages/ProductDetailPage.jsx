import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { getProductById } from "../api/products";

// Ảnh nhỏ cho nút chọn phiên bản: ảnh Cloudinary thì xin bản thu nhỏ, ảnh khác giữ nguyên
function thumbnail(url) {
    return url?.includes("/image/upload/") ? url.replace("/image/upload/", "/image/upload/w_96,h_96,c_pad,b_white/") : url;
}

// description: mỗi dòng "Nhãn: giá trị" thành 1 dòng bảng thông số; dòng không có nhãn giữ nguyên là văn bản
function parseSpecs(description) {
    return String(description || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
            return m ? { label: m[1].trim(), value: m[2].trim() } : { text: line };
        });
}

function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    // Sản phẩm có phiên bản thì luôn có 1 phiên bản đang chọn (mặc định là cái đầu tiên còn hàng)
    const variants = product?.variants ?? [];
    const variant =
        variants.find((v) => v.id === selectedVariantId) ??
        variants.find((v) => v.stock > 0) ??
        variants[0] ??
        null;
    // Phiên bản có ảnh riêng (vd mỗi màu một ảnh) thì hiện ảnh đó, không thì dùng ảnh sản phẩm
    const imageSrc = variant?.image || product?.image;
    const hasVariantImages = variants.some((v) => v.image);
    const specs = parseSpecs(product?.description);

    // Tải sẵn ảnh các phiên bản để bấm đổi không bị nháy trắng
    useEffect(() => {
        (product?.variants ?? []).forEach((v) => {
            if (v.image) new Image().src = v.image;
        });
    }, [product]);

    useEffect(() => {
        getProductById(id)
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
                        {imageSrc && (
                            <div className="aspect-square bg-[#F5F3EE]">
                                <img
                                    key={imageSrc}
                                    src={imageSrc}
                                    alt={variant ? `${product.name} - ${variant.name}` : product.name}
                                    className="variant-image-in h-full w-full object-cover"
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

                        {product.short_description && (
                            <p className="-mt-1 mb-4 text-[15px] leading-6 text-[#6B6B65]">
                                {product.short_description}
                            </p>
                        )}

                        <p className="mb-6 text-2xl font-medium text-[#2F5233]">
                            {Number(variant ? variant.price : product.price).toLocaleString("vi-VN")}₫
                        </p>

                        {variants.length > 0 && (
                            <div className="mb-6">
                                <p className="mb-2 text-sm text-[#6B6B65]">
                                    Phiên bản:{" "}
                                    <span className="font-medium text-[#1A1A18]">{variant?.name}</span>
                                </p>
                                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn phiên bản">
                                    {variants.map((v) => {
                                        const active = variant && v.id === variant.id;
                                        const soldOut = v.stock <= 0;
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={Boolean(active)}
                                                onClick={() => setSelectedVariantId(v.id)}
                                                title={soldOut ? `${v.name} (hết hàng)` : v.name}
                                                className={`flex items-center gap-2 rounded-md border text-sm transition-colors ${
                                                    hasVariantImages ? "py-1.5 pl-1.5 pr-3" : "px-4 py-2"
                                                } ${
                                                    active
                                                        ? "border-[#2F5233] ring-1 ring-[#2F5233] bg-white text-[#1A1A18]"
                                                        : "border-[#D9D6CC] bg-white text-[#1A1A18] hover:border-[#2F5233]"
                                                } ${soldOut ? "opacity-50" : ""}`}
                                            >
                                                {hasVariantImages && (
                                                    <img
                                                        src={thumbnail(v.image || product.image)}
                                                        alt=""
                                                        className="h-10 w-10 rounded object-contain bg-[#F5F3EE]"
                                                    />
                                                )}
                                                <span className={soldOut ? "line-through" : ""}>{v.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mb-8 border-b border-[#D9D6CC]" />

                        <div className="mb-8">
                            <p className="text-sm text-[#6B6B65]">
                                Còn lại:{" "}
                                <span className="font-medium text-[#1A1A18]">
                                    {variant ? variant.stock : product.stock}
                                </span>
                            </p>
                        </div>

                        <button
                            onClick={() => addToCart(product, variant)}
                            disabled={variant && variant.stock <= 0}
                            className="w-full rounded-md bg-[#2F5233] px-6 py-3.5 font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {variant && variant.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                        </button>

                        <Link
                            to="/products"
                            className="mt-4 text-center text-sm font-medium text-[#6B6B65] hover:text-[#2F5233]"
                        >
                            ← Quay lại
                        </Link>

                    </div>
                </div>

                {specs.length > 0 && (
                    <div className="mt-14 max-w-3xl">
                        <h2
                            className="mb-4 text-2xl text-[#1A1A18]"
                            style={{ fontFamily: "'Fraunces', serif" }}
                        >
                            Thông số kỹ thuật
                        </h2>
                        <dl className="rounded-lg border border-[#D9D6CC] bg-white">
                            {specs.map((s, i) =>
                                s.label ? (
                                    <div
                                        key={i}
                                        className="grid grid-cols-[9rem_1fr] gap-4 border-b border-[#EFEDE6] px-5 py-3 text-sm last:border-b-0 sm:grid-cols-[12rem_1fr]"
                                    >
                                        <dt className="text-[#6B6B65]">{s.label}</dt>
                                        <dd className="text-[#1A1A18]">{s.value}</dd>
                                    </div>
                                ) : (
                                    <p
                                        key={i}
                                        className="border-b border-[#EFEDE6] px-5 py-3 text-sm text-[#1A1A18] last:border-b-0"
                                    >
                                        {s.text}
                                    </p>
                                )
                            )}
                        </dl>
                    </div>
                )}
            </section>
        </main>
    );
}

export default ProductDetailPage;