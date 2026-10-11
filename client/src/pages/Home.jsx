import ProductCard from "../components/ProductCard";
import HeroBanner from "../components/HeroBanner";
import Reveal from "../components/Reveal";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const featuredProducts = products.filter((item) => item.feature);
    // Sản phẩm giá trị cao: 4 sản phẩm đắt nhất
    const premiumProducts = [...products]
        .sort((a, b) => Number(b.price) - Number(a.price))
        .slice(0, 4);
    // Phụ kiện cho góc làm việc
    const accessoryProducts = products
        .filter((item) => item.category === "Phu-kien")
        .slice(0, 4);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/products`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Không lấy được dữ liệu sản phẩm");
                }
                return res.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-[#FAFAF8]">
                <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center p-10 bg-[#FAFAF8] min-h-[400px]">
                <div className="max-w-lg w-full rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4 text-[#B3413B] text-sm">
                    Lỗi: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8]">

            {/* HERO */}
            <HeroBanner products={featuredProducts} />


            {/* SẢN PHẨM CAO CẤP */}
            <ProductSection
                eyebrow="Cao cấp"
                title="Đầu tư cho hiệu suất"
                subtitle="Những thiết bị mạnh mẽ, bền bỉ cho công việc và sáng tạo."
                products={premiumProducts}
                className="py-20"
            />


            {/* PROMO — ảnh góc làm việc chuyển động thay cho khối màu */}
            <Reveal as="section" from="up" className="max-w-6xl mx-auto px-6">
                <PromoBanner />
            </Reveal>


            {/* PHỤ KIỆN */}
            <ProductSection
                eyebrow="Phụ kiện"
                title="Hoàn thiện từng chi tiết"
                subtitle="Chuột, bàn phím, tai nghe, webcam — nâng cấp nhỏ, khác biệt lớn."
                products={accessoryProducts}
                linkTo="/products"
                className="pt-12 pb-20"
            />

        </div>
    );
}

// Ảnh từ Unsplash (giấy phép Unsplash, miễn phí dùng thương mại)
const PROMO_IMAGES = [
    "https://images.unsplash.com/photo-1570993492881-25240ce854f4?auto=format&fit=crop&w=1600&q=75",
    "https://images.unsplash.com/photo-1594636797501-ef436e157819?auto=format&fit=crop&w=1600&q=75",
];

function PromoBanner() {
    return (
        <Link
            to="/products"
            className="promo-banner group relative block aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-2xl bg-[#1E3A22]"
        >
            {PROMO_IMAGES.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    className={`promo-slide promo-slide-${i + 1} absolute inset-0 h-full w-full object-cover`}
                />
            ))}

            {/* Lớp phủ để chữ luôn đọc rõ trên ảnh */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

            <div className="relative flex h-full flex-col justify-end p-8 md:p-14 text-white">
                <p className="text-sm tracking-wide text-white/80 mb-3">Ưu đãi có hạn</p>
                <h2
                    className="max-w-lg text-3xl md:text-5xl leading-tight"
                    style={{ fontFamily: "'Fraunces', serif" }}
                >
                    Hoàn thiện góc làm việc của bạn.
                </h2>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white/95 px-5 py-2.5 font-medium text-[#2F5233] transition-colors group-hover:bg-white">
                    Mua sắm ngay
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
            </div>
        </Link>
    );
}

function ProductSection({ eyebrow, title, subtitle, products, linkTo = "/products", className = "" }) {
    if (products.length === 0) return null;

    return (
        <section className={`max-w-6xl mx-auto px-6 ${className}`}>
            <Reveal from="up" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm tracking-wide text-[#6B6B65] mb-2">{eyebrow}</p>
                    <h2
                        className="text-3xl md:text-4xl text-[#1A1A18]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        {title}
                    </h2>
                    <p className="mt-2 text-[#6B6B65]">{subtitle}</p>
                </div>

                <Link
                    to={linkTo}
                    className="text-[#2F5233] font-medium underline underline-offset-2 self-start md:self-auto"
                >
                    Xem tất cả
                </Link>
            </Reveal>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {products.map((p, i) => (
                    <Reveal key={p.id} from="left" delay={i * 110}>
                        <div className="h-full transition duration-300 hover:-translate-y-1">
                            <ProductCard product={p} />
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

export default Home;
