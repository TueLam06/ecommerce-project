import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Ảnh nhỏ cho ô chọn màu: ảnh Cloudinary thì xin bản thu nhỏ
function thumbnail(url) {
    return url?.includes("/image/upload/") ? url.replace("/image/upload/", "/image/upload/w_64,h_64,c_pad,b_white/") : url;
}

const formatVND = (n) => `${Number(n).toLocaleString("vi-VN")}₫`;
const MAX_CHIPS = 4;

function StockStatus({ stock }) {
    const [color, label] =
        stock <= 0
            ? ["text-[#B3413B]", "Hết hàng"]
            : stock <= 5
              ? ["text-[#8A6D1D]", `Chỉ còn ${stock} sản phẩm`]
              : ["text-[#2F5233]", "Còn hàng"];
    return (
        <p className={`flex items-center gap-1.5 ${color}`}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
            {label}
        </p>
    );
}

function ProductCard({ product }) {
    const { addToCart } = useCart();
    const variants = product.variants ?? [];
    const hasVariantImages = variants.some((v) => v.image);

    // Chọn phiên bản ngay trên thẻ (mặc định phiên bản đầu tiên còn hàng)
    const [selectedId, setSelectedId] = useState(null);
    const variant =
        variants.find((v) => v.id === selectedId) ?? variants.find((v) => v.stock > 0) ?? variants[0] ?? null;

    const image = variant?.image || product.image;
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const detailUrl = `/products/${product.id}`;
    const subtitle = product.short_description;

    return (
        <div className="product-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#E5E3DC] bg-white transition-all hover:border-[#D9D6CC] hover:shadow-md">
            <Link to={detailUrl} className="block">
                <div className="aspect-square overflow-hidden bg-[#F5F3EE]">
                    {image && (
                        <img
                            key={image}
                            src={image}
                            alt={variant ? `${product.name} - ${variant.name}` : product.name}
                            loading="lazy"
                            className="variant-image-in h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-3 md:p-4">
                {product.category_name && (
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#8A8A82]">
                        {product.category_name}
                    </p>
                )}

                <Link to={detailUrl}>
                    <h3
                        className="line-clamp-2 text-sm md:text-[15px] font-semibold leading-5 text-[#1A1A18] transition-colors hover:text-[#2F5233]"
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </Link>

                {subtitle && (
                    <p className="mt-1 line-clamp-2 text-xs md:text-[13px] leading-5 text-[#6B6B65]" title={subtitle}>
                        {subtitle}
                    </p>
                )}

                {variants.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Chọn phiên bản">
                        {variants.slice(0, MAX_CHIPS).map((v) => {
                            const active = variant && v.id === variant.id;
                            const soldOut = v.stock <= 0;
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={Boolean(active)}
                                    aria-label={v.name}
                                    title={soldOut ? `${v.name} (hết hàng)` : v.name}
                                    onClick={() => setSelectedId(v.id)}
                                    className={`rounded-md border text-xs transition-colors ${
                                        active
                                            ? "border-[#1A1A18] text-[#1A1A18]"
                                            : "border-transparent text-[#6B6B65] hover:border-[#D9D6CC]"
                                    } ${soldOut ? "opacity-40" : ""} ${hasVariantImages ? "p-0.5" : "max-w-[8.5rem] truncate px-2 py-1"}`}
                                >
                                    {hasVariantImages ? (
                                        <img
                                            src={thumbnail(v.image || product.image)}
                                            alt=""
                                            className="h-7 w-7 rounded object-contain bg-[#F5F3EE]"
                                        />
                                    ) : (
                                        v.name
                                    )}
                                </button>
                            );
                        })}
                        {variants.length > MAX_CHIPS && (
                            <Link to={detailUrl} className="px-1 text-xs text-[#6B6B65] hover:text-[#2F5233]">
                                +{variants.length - MAX_CHIPS}
                            </Link>
                        )}
                    </div>
                )}

                {hasVariantImages && variant && (
                    <p className="mt-1 truncate text-xs text-[#6B6B65]">{variant.name}</p>
                )}

                <div className="mt-3 space-y-1 text-xs">
                    <StockStatus stock={stock} />
                    <p className="flex items-center gap-1.5 text-[#6B6B65]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                            <path
                                d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Giao tại Hà Nội, TP.HCM</span>
                    </p>
                </div>

                <div className="mt-auto pt-3">
                    <p className="text-sm md:text-base font-semibold text-[#2F5233]">
                        {formatVND(price)}
                    </p>

                    <button
                        type="button"
                        onClick={() => addToCart(product, variant)}
                        disabled={stock <= 0}
                        className="mt-2 w-full rounded-full bg-[#2F5233] py-2 text-sm font-medium text-[#F5F3EE] transition-colors hover:bg-[#244027] disabled:cursor-not-allowed disabled:bg-[#D9D6CC] disabled:text-[#6B6B65]"
                    >
                        {stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
