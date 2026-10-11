import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
    const { addToCart } = useCart();

    return (
        <div className="product-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#E5E3DC] bg-white transition-all hover:border-[#D9D6CC] hover:shadow-md">

            <Link to={`/products/${product.id}`} className="block">
                <div className="aspect-square overflow-hidden bg-[#F5F3EE]">
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-3 md:p-4">
                <Link to={`/products/${product.id}`}>
                    <h3
                        className="line-clamp-2 min-h-[2.5rem] text-sm md:text-[15px] font-medium leading-5 text-[#1A1A18] transition-colors hover:text-[#2F5233]"
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <p className="text-sm md:text-base font-semibold text-[#2F5233]">
                        {Number(product.price).toLocaleString("vi-VN")}₫
                    </p>

                    <button
                        type="button"
                        onClick={() => addToCart(product)}
                        aria-label={`Thêm ${product.name} vào giỏ hàng`}
                        title="Thêm vào giỏ hàng"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#2F5233] text-[#F5F3EE] transition-colors hover:bg-[#244027]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.76L20 8H6.2"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="9" cy="20" r="1.3" fill="currentColor" />
                            <circle cx="17" cy="20" r="1.3" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
