import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../api/http";
import { createProduct, updateProduct } from "../api/adminProducts";

const emptyForm = {
    name: "",
    price: "",
    stock: "",
    description: "",
    image_url: "",
    category_id: "",
};

const inputClass =
    "w-full rounded-md border border-[#D9D6CC] bg-white px-3 py-2 text-sm text-[#1A1A18] focus:outline-none focus:border-[#2F5233]";
const labelClass = "block text-sm text-[#6B6B65] mb-1";

export default function ProductForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { token } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyForm);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Lấy danh sách categories cho dropdown
    useEffect(() => {
        authFetch("/api/admin/products/categories", { token })
            .then(setCategories)
            .catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        authFetch(`/api/admin/products/${id}`, { token })
            .then((data) => {
                setForm({
                    name: data.name ?? "",
                    price: data.price ?? "",
                    stock: data.stock ?? "",
                    description: data.description ?? "",
                    // Cột DB tên là "image", không phải "image_url"
                    image_url: data.image ?? "",
                    category_id: data.category_id ?? "",
                });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            name: form.name,
            price: Number(form.price),
            description: form.description || null,
            image_url: form.image_url || null,
            category_id: form.category_id || null,
        };
        if (!isEdit) {
            payload.stock = Number(form.stock);
        }

        try {
            if (isEdit) {
                await updateProduct(id, payload, token);
            } else {
                await createProduct(payload, token);
            }
            navigate("/admin/products");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#D9D6CC] border-t-[#2F5233] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-xl">
            <h2
                className="text-2xl text-[#1A1A18] mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
            >
                {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>

            {error && (
                <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-4 py-3 text-[#B3413B] text-sm mb-6">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="rounded-md border border-[#E5E3DC] bg-white p-6 flex flex-col gap-4"
            >
                <div>
                    <label className={labelClass}>Tên sản phẩm</label>
                    <input
                        className={inputClass}
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Giá</label>
                    <input
                        className={inputClass}
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>

                {!isEdit && (
                    <div>
                        <label className={labelClass}>Tồn kho ban đầu</label>
                        <input
                            className={inputClass}
                            type="number"
                            name="stock"
                            value={form.stock}
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>
                )}

                <div>
                    <label className={labelClass}>Mô tả</label>
                    <textarea
                        className={inputClass}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                    />
                </div>

                <div>
                    <label className={labelClass}>Link ảnh</label>
                    <input
                        className={inputClass}
                        name="image_url"
                        value={form.image_url}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className={labelClass}>Danh mục</label>
                    <select
                        className={inputClass}
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 rounded-md bg-[#2F5233] text-[#F5F3EE] px-6 py-2.5 font-medium hover:bg-[#274529] transition-colors disabled:opacity-60"
                >
                    {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm sản phẩm"}
                </button>
            </form>
        </div>
    );
}