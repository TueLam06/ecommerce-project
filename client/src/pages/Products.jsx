import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import CategoryIcon from "../components/CategoryIcon";
import Dropdown from "../components/Dropdown";

const SORT_OPTIONS = [
    { value: "newest-desc", label: "Mới nhất", sort: "newest", order: "desc" },
    { value: "price-asc", label: "Giá: Thấp đến cao", sort: "price", order: "asc" },
    { value: "price-desc", label: "Giá: Cao đến thấp", sort: "price", order: "desc" },
    { value: "name-asc", label: "Tên: A-Z", sort: "name", order: "asc" },
    { value: "name-desc", label: "Tên: Z-A", sort: "name", order: "desc" },
];

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortValue, setSortValue] = useState("newest-desc");
    const [categoryValue, setCategoryValue] = useState("all");

    // Lấy danh sách categories 1 lần khi mount
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Lỗi tải categories:", err));
    }, []);

    // Lấy danh sách sản phẩm, phụ thuộc vào sort + category
    useEffect(() => {
        const selected =
            SORT_OPTIONS.find((o) => o.value === sortValue) || SORT_OPTIONS[0];
        const params = new URLSearchParams({
            sort: selected.sort,
            order: selected.order,
        });
        if (categoryValue !== "all") {
            params.set("category", categoryValue);
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`)
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
    }, [sortValue, categoryValue]);

    const selectedCategory = categories.find((c) => String(c.id) === String(categoryValue));

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FAFAF8]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-center min-h-[300px]">
                        <p className="text-[#6B6B65]">
                            Đang tải sản phẩm...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-[#FAFAF8]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-5 py-4">
                        <p className="font-medium text-[#B3413B]">
                            Lỗi: {error}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAFAF8]">
            {/* Page Header */}
            <section className="bg-[#2F5233]">
                <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#D8E2D2]">
                        Bộ sưu tập của chúng tôi
                    </p>

                    <h1
                        className="text-4xl md:text-5xl font-normal text-[#F5F3EE]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                    >
                        Chúng tôi có gì?
                    </h1>

                    <p className="mt-4 max-w-xl text-[#D8E2D2] leading-relaxed">
                        Khám phá các sản phẩm được lựa chọn dành cho không gian
                        làm việc và cuộc sống hiện đại.
                    </p>
                </div>
            </section>

            {/* Products */}
            <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
                {/* Danh mục dạng ô icon */}
                <div
                    role="tablist"
                    aria-label="Danh mục sản phẩm"
                    className="-mx-6 px-6 mb-10 flex gap-3 overflow-x-auto pb-1 md:mx-0 md:px-0 md:flex-wrap"
                >
                    {[{ id: "all", slug: "all", name: "Tất cả" }, ...categories].map((c) => {
                        const active = String(c.id) === String(categoryValue);
                        return (
                            <button
                                key={c.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setCategoryValue(String(c.id))}
                                className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-3 rounded-lg border bg-white transition-colors md:h-[120px] md:w-[120px] ${
                                    active
                                        ? "border-[#1A1A18] text-[#1A1A18]"
                                        : "border-[#E5E3DC] text-[#3A3A36] hover:border-[#B0AC9C]"
                                }`}
                            >
                                <CategoryIcon slug={c.slug} className="h-10 w-10" />
                                <span className="text-sm font-medium">{c.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <h2
                            className="text-2xl md:text-3xl text-[#1A1A18]"
                            style={{ fontFamily: "'Fraunces', serif" }}
                        >
                            {selectedCategory ? selectedCategory.name : "Tất cả sản phẩm"}
                        </h2>

                        <p className="mt-2 text-sm text-[#6B6B65]">
                            {products.length} sản phẩm
                        </p>
                    </div>

                    <Dropdown
                        label="Sắp xếp:"
                        value={sortValue}
                        options={SORT_OPTIONS}
                        onChange={setSortValue}
                    />
                </div>

                {products.length === 0 ? (
                    <div className="rounded-md border border-[#D9D6CC] bg-white py-16 text-center">
                        <p className="text-[#6B6B65]">
                            Chưa có sản phẩm nào.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Products;