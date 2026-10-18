import { useState } from "react";
import { createVariant, updateVariant, deleteVariant } from "../api/adminProducts";

// Ảnh nhỏ xem trước: ảnh Cloudinary thì xin bản thu nhỏ
function thumbnail(url) {
    return url.includes("/image/upload/") ? url.replace("/image/upload/", "/image/upload/w_96,h_96,c_pad,b_white/") : url;
}

// Ô nhập link ảnh phiên bản + ảnh xem trước (bỏ trống = dùng ảnh sản phẩm)
function ImageField({ value, onChange }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-[#E5E3DC] bg-[#F5F3EE]">
                {value && <img src={thumbnail(value)} alt="" className="h-full w-full object-contain" />}
            </div>
            <input
                className={inputClass}
                name="image"
                placeholder="Link ảnh riêng của phiên bản (bỏ trống = dùng ảnh sản phẩm)"
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

const inputClass =
    "w-full rounded-md border border-[#D9D6CC] bg-white px-3 py-2 text-sm text-[#1A1A18] focus:outline-none focus:border-[#2F5233]";

// Một dòng phiên bản: sửa tên/giá/tồn kho rồi bấm Lưu, hoặc Xoá
function VariantRow({ productId, variant, token, onSaved, onDeleted, onError }) {
    const [form, setForm] = useState({
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        image: variant.image ?? "",
    });
    const [busy, setBusy] = useState(false);

    const dirty =
        form.name !== variant.name ||
        Number(form.price) !== Number(variant.price) ||
        Number(form.stock) !== Number(variant.stock) ||
        form.image !== (variant.image ?? "");

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setBusy(true);
        onError("");
        try {
            const saved = await updateVariant(productId, variant.id, form, token);
            // Ảnh link ngoài đã được server đổi sang link Cloudinary
            setForm((prev) => ({ ...prev, image: saved.image ?? "" }));
            onSaved(saved);
        } catch (err) {
            onError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Xoá phiên bản "${variant.name}"? Sản phẩm này sẽ bị gỡ khỏi các giỏ hàng đang chứa phiên bản này.`)) {
            return;
        }
        setBusy(true);
        onError("");
        try {
            await deleteVariant(productId, variant.id, token);
            onDeleted(variant.id);
        } catch (err) {
            onError(err.message);
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 rounded-md border border-[#EFEDE6] p-3">
            <div className="grid grid-cols-[1fr_110px_80px_auto] gap-2 items-center">
                <input className={inputClass} name="name" value={form.name} onChange={handleChange} />
                <input className={inputClass} type="number" min="0" name="price" value={form.price} onChange={handleChange} />
                <input className={inputClass} type="number" min="0" name="stock" value={form.stock} onChange={handleChange} />
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={busy || !dirty}
                        className="rounded-md bg-[#2F5233] px-3 py-2 text-sm text-[#F5F3EE] disabled:opacity-40"
                    >
                        Lưu
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={busy}
                        className="rounded-md border border-[#E3C6C3] px-3 py-2 text-sm text-[#B3413B] hover:bg-[#FBF1F0] disabled:opacity-40"
                    >
                        Xoá
                    </button>
                </div>
            </div>
            <ImageField value={form.image} onChange={handleChange} />
        </div>
    );
}

// Quản lý phiên bản của 1 sản phẩm (vd "16GB RAM", "32GB RAM"). Chỉ dùng khi sửa sản phẩm đã tồn tại.
export default function VariantEditor({ productId, initialVariants, token }) {
    const [variants, setVariants] = useState(initialVariants);
    const [newVariant, setNewVariant] = useState({ name: "", price: "", stock: "", image: "" });
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    const handleNewChange = (e) => setNewVariant((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAdd = async () => {
        setAdding(true);
        setError("");
        try {
            const created = await createVariant(productId, newVariant, token);
            setVariants((prev) => [...prev, created]);
            setNewVariant({ name: "", price: "", stock: "", image: "" });
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="mt-6 rounded-md border border-[#E5E3DC] bg-white p-6">
            <h3 className="text-lg text-[#1A1A18] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                Phiên bản
            </h3>
            <p className="text-sm text-[#6B6B65] mb-4">
                Có phiên bản thì giá và tồn kho tính theo từng phiên bản, giá/tồn kho ở trên không còn được dùng.
                Phiên bản được lưu ngay khi bấm Lưu, không cần bấm &quot;Cập nhật&quot;.
            </p>

            {error && (
                <div className="rounded-md border border-[#E3C6C3] bg-[#FBF1F0] px-4 py-3 text-[#B3413B] text-sm mb-4">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-2">
                {variants.length > 0 && (
                    <div className="grid grid-cols-[1fr_110px_80px_auto] gap-2 text-xs text-[#6B6B65]">
                        <span>Tên (vd 16GB / 512GB, Màu bạc)</span>
                        <span>Giá</span>
                        <span>Tồn kho</span>
                        <span className="w-[116px]" />
                    </div>
                )}

                {variants.map((v) => (
                    <VariantRow
                        key={v.id}
                        productId={productId}
                        variant={v}
                        token={token}
                        onError={setError}
                        onSaved={(saved) => setVariants((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
                        onDeleted={(id) => setVariants((prev) => prev.filter((x) => x.id !== id))}
                    />
                ))}

                <div className="mt-2 pt-4 border-t border-[#EFEDE6] flex flex-col gap-2">
                    <div className="grid grid-cols-[1fr_110px_80px_auto] gap-2 items-center">
                        <input
                            className={inputClass}
                            name="name"
                            placeholder="Tên phiên bản mới"
                            value={newVariant.name}
                            onChange={handleNewChange}
                        />
                        <input
                            className={inputClass}
                            type="number"
                            min="0"
                            name="price"
                            placeholder="Giá"
                            value={newVariant.price}
                            onChange={handleNewChange}
                        />
                        <input
                            className={inputClass}
                            type="number"
                            min="0"
                            name="stock"
                            placeholder="Kho"
                            value={newVariant.stock}
                            onChange={handleNewChange}
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={adding}
                            className="rounded-md border border-[#2F5233] px-3 py-2 text-sm text-[#2F5233] hover:bg-[#EFEDE6] disabled:opacity-40 w-[116px]"
                        >
                            {adding ? "Đang thêm..." : "+ Thêm"}
                        </button>
                    </div>
                    <ImageField value={newVariant.image} onChange={handleNewChange} />
                </div>
            </div>
        </div>
    );
}
