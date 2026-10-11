import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const SLIDE_DURATION = 5000;

// Banner chuyển động: slide giới thiệu + slide cho từng sản phẩm nổi bật
function HeroBanner({ products = [] }) {
    const { addToCart } = useCart();
    const spotlight = products.filter((p) => p.image).slice(0, 3);
    const slides = [{ type: "intro" }, ...spotlight.map((p) => ({ type: "product", product: p }))];

    const [index, setIndex] = useState(0);
    const autoplay = slides.length > 1;

    // Tự chuyển slide; bấm chuyển tay thì đếm lại từ đầu (vì index đổi)
    useEffect(() => {
        if (!autoplay) return;
        const timer = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_DURATION);
        return () => clearTimeout(timer);
    }, [autoplay, index, slides.length]);

    const go = (i) => setIndex((i + slides.length) % slides.length);
    const slide = slides[index] ?? slides[0];

    return (
        <section
            className="hero-banner relative overflow-hidden bg-[#2F5233] text-[#F5F3EE]"
            aria-roledescription="carousel"
        >
            {/* Nền chuyển động */}
            <div className="hero-blob hero-blob-1" aria-hidden="true" />
            <div className="hero-blob hero-blob-2" aria-hidden="true" />
            <div className="hero-blob hero-blob-3" aria-hidden="true" />
            <div className="hero-grain" aria-hidden="true" />

            <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
                <div
                    key={index}
                    className="grid md:grid-cols-2 gap-10 md:gap-12 items-center md:min-h-[440px]"
                >
                    {slide.type === "intro" ? (
                        <IntroSlide products={spotlight} />
                    ) : (
                        <ProductSlide product={slide.product} onAdd={() => addToCart(slide.product)} />
                    )}
                </div>

                {/* Điều khiển */}
                {slides.length > 1 && (
                    <div className="flex items-center gap-4 mt-10">
                        <div className="flex gap-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => go(i)}
                                    aria-label={`Slide ${i + 1}`}
                                    aria-current={i === index}
                                    className="relative h-1 w-10 md:w-14 overflow-hidden rounded-full bg-white/20"
                                >
                                    {i < index && <span className="absolute inset-0 bg-[#F5F3EE]" />}
                                    {i === index && (
                                        <span
                                            className={`absolute inset-0 bg-[#F5F3EE] ${
                                                autoplay ? "hero-progress" : ""
                                            }`}
                                            style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto flex gap-2">
                            <ArrowButton label="Slide trước" onClick={() => go(index - 1)} flip />
                            <ArrowButton label="Slide tiếp" onClick={() => go(index + 1)} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function IntroSlide({ products }) {
    return (
        <>
            <div>
                <p className="hero-in text-sm tracking-wide text-[#B7C9AF] mb-4" style={{ "--d": "0ms" }}>
                    Bộ sưu tập mới
                </p>
                <h1
                    className="hero-in text-4xl md:text-6xl leading-tight mb-6"
                    style={{ fontFamily: "'Fraunces', serif", "--d": "80ms" }}
                >
                    Nâng cấp không gian sống của bạn.
                </h1>
                <p
                    className="hero-in text-[#D8E2D2] text-base md:text-lg max-w-xl leading-relaxed mb-10"
                    style={{ "--d": "160ms" }}
                >
                    Sản phẩm công nghệ chất lượng, chọn lọc kỹ càng cho công việc, giải trí và cuộc
                    sống hằng ngày.
                </p>
                <div className="hero-in flex flex-wrap gap-4" style={{ "--d": "240ms" }}>
                    <Link
                        to="/products"
                        className="rounded-md bg-[#F5F3EE] text-[#2F5233] px-6 py-3 font-medium hover:bg-white transition-colors"
                    >
                        Mua ngay
                    </Link>
                    <Link
                        to="/products"
                        className="rounded-md border border-[#7C9473] text-[#F5F3EE] px-6 py-3 font-medium hover:bg-white/5 transition-colors"
                    >
                        Xem sản phẩm
                    </Link>
                </div>
            </div>

            {/* Cụm ảnh sản phẩm trôi nhẹ */}
            <div className="relative h-72 md:h-[420px] hidden sm:block" aria-hidden="true">
                {products.map((p, i) => (
                    <div
                        key={p.id}
                        className={`hero-slide-in absolute rounded-2xl bg-[#F5F3EE] p-2 shadow-2xl shadow-black/25 ${
                            ["left-[4%] top-[8%] w-[46%] rotate-[-6deg]",
                             "right-[2%] top-[0%] w-[40%] rotate-[5deg]",
                             "left-[30%] bottom-[0%] w-[44%] rotate-[2deg]"][i]
                        }`}
                        style={{ "--d": `${200 + i * 160}ms` }}
                    >
                        <div className="hero-float" style={{ "--f": `${i * -2.2}s` }}>
                            <div className="aspect-square w-full overflow-hidden rounded-xl">
                                <img
                                    src={p.image}
                                    alt=""
                                    className="hero-pan h-full w-full object-cover"
                                    style={{ animationDelay: `${i * -3}s` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function ProductSlide({ product, onAdd }) {
    return (
        <>
            <div className="order-2 md:order-1">
                <p className="hero-in text-sm tracking-wide text-[#B7C9AF] mb-4" style={{ "--d": "0ms" }}>
                    Sản phẩm nổi bật
                </p>
                <h2
                    className="hero-in text-4xl md:text-6xl leading-tight mb-5"
                    style={{ fontFamily: "'Fraunces', serif", "--d": "80ms" }}
                >
                    {product.name}
                </h2>
                {product.description && (
                    <p
                        className="hero-in text-[#D8E2D2] text-base md:text-lg max-w-xl leading-relaxed mb-6 line-clamp-2"
                        style={{ "--d": "160ms" }}
                    >
                        {product.description.split("\n")[0]}
                    </p>
                )}
                <p
                    className="hero-in text-2xl md:text-3xl mb-8"
                    style={{ fontFamily: "'Fraunces', serif", "--d": "200ms" }}
                >
                    {Number(product.price).toLocaleString("vi-VN")}₫
                </p>
                <div className="hero-in flex flex-wrap gap-4" style={{ "--d": "260ms" }}>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="rounded-md bg-[#F5F3EE] text-[#2F5233] px-6 py-3 font-medium hover:bg-white transition-colors"
                    >
                        Thêm vào giỏ hàng
                    </button>
                    <Link
                        to={`/products/${product.id}`}
                        className="rounded-md border border-[#7C9473] text-[#F5F3EE] px-6 py-3 font-medium hover:bg-white/5 transition-colors"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center">
                <div
                    className="hero-pop relative w-full max-w-sm md:max-w-md aspect-square rounded-3xl bg-[#F5F3EE] p-3 shadow-2xl shadow-black/30"
                    style={{ "--d": "120ms" }}
                >
                    <div className="h-full w-full overflow-hidden rounded-2xl">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="hero-kenburns h-full w-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function ArrowButton({ label, onClick, flip }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-[#F5F3EE] hover:bg-white/10 transition-colors"
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={flip ? "rotate-180" : ""}
                aria-hidden="true"
            >
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

export default HeroBanner;
