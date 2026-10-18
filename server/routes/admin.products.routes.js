const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { verifyToken, requireAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken, requireAdmin);

// Upload ảnh từ URL lên Cloudinary; URL đã là Cloudinary thì giữ nguyên
async function uploadImageUrl(url) {
    if (!url) return null;
    if (url.includes("res.cloudinary.com")) return url;
    const result = await cloudinary.uploader.upload(url, {
        folder: "ecommerce/products",
    });
    return result.secure_url;
}

// GET /api/admin/products - admin xem TẤT CẢ, kể cả sản phẩm đã ẩn
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, v.min_price, v.total_stock, COALESCE(v.variant_count, 0)::int AS variant_count
             FROM products p
             LEFT JOIN (
                 SELECT product_id, MIN(price) AS min_price, SUM(stock)::int AS total_stock, COUNT(*) AS variant_count
                 FROM product_variants
                 GROUP BY product_id
             ) v ON v.product_id = p.id
             ORDER BY p.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET /admin/products error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// GET /api/admin/products/categories
router.get("/categories", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name FROM categories ORDER BY name"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET /admin/products/categories error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// GET /api/admin/products/:id - Lấy chi tiết 1 sản phẩm
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }
        const variants = await pool.query(
            "SELECT id, name, price, stock, image FROM product_variants WHERE product_id = $1 ORDER BY sort_order, id",
            [id]
        );
        res.json({ ...result.rows[0], variants: variants.rows });
    } catch (err) {
        console.error("GET /admin/products/:id error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// POST /api/admin/products - Thêm sản phẩm mới
router.post("/", async (req, res) => {
    const { name, price, stock, description, short_description, image_url, category_id } = req.body;

    if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: "Thiếu name/price/stock" });
    }
    if (Number(price) < 0 || Number(stock) < 0) {
        return res.status(400).json({ error: "price/stock không được âm" });
    }

    let image;
    try {
        image = await uploadImageUrl(image_url);
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return res.status(400).json({ error: "Không upload được ảnh từ URL này" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO products (name, price, stock, description, short_description, image, category_id, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
            [name, price, stock, description || null, short_description || null, image, category_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("POST /admin/products error:", err);
        res.status(500).json({ error: "Lỗi server khi tạo sản phẩm" });
    }
});

// PUT /api/admin/products/:id - Sửa thông tin sản phẩm
// LƯU Ý: không cho sửa "stock" ở đây nữa, dùng route /:id/stock riêng bên dưới
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price, description, short_description, image_url, category_id } = req.body;

    if (price !== undefined && Number(price) < 0) {
        return res.status(400).json({ error: "price không được âm" });
    }

    try {
        const existing = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }
        const current = existing.rows[0];

        // Chỉ upload khi admin đổi sang URL ảnh mới
        let image = current.image;
        if (image_url !== undefined && image_url !== current.image) {
            try {
                image = await uploadImageUrl(image_url);
            } catch (err) {
                console.error("Cloudinary upload error:", err);
                return res.status(400).json({ error: "Không upload được ảnh từ URL này" });
            }
        }

        const result = await pool.query(
            `UPDATE products
             SET name = $1, price = $2, description = $3, short_description = $4, image = $5, category_id = $6
             WHERE id = $7 RETURNING *`,
            [
                name ?? current.name,
                price ?? current.price,
                description ?? current.description,
                short_description !== undefined ? short_description || null : current.short_description,
                image,
                category_id ?? current.category_id,
                id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("PUT /admin/products/:id error:", err);
        res.status(500).json({ error: "Lỗi server khi cập nhật sản phẩm" });
    }
});

// PATCH /api/admin/products/:id/stock - Điều chỉnh tồn kho
// body: { type: "add" | "subtract" | "set", quantity: number }
router.patch("/:id/stock", async (req, res) => {
    const { id } = req.params;
    const { type, quantity } = req.body;

    if (!["add", "subtract", "set"].includes(type)) {
        return res.status(400).json({ error: "type phải là 'add', 'subtract' hoặc 'set'" });
    }
    if (quantity === undefined || Number(quantity) < 0 || !Number.isInteger(Number(quantity))) {
        return res.status(400).json({ error: "quantity phải là số nguyên không âm" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existing = await client.query(
            "SELECT * FROM products WHERE id = $1 FOR UPDATE",
            [id]
        );
        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }
        const product = existing.rows[0];

        let newStock;
        if (type === "add") {
            newStock = product.stock + Number(quantity);
        } else if (type === "subtract") {
            newStock = product.stock - Number(quantity);
            if (newStock < 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    error: `Không thể trừ: tồn kho hiện tại chỉ còn ${product.stock}`,
                });
            }
        } else {
            newStock = Number(quantity);
        }

        const result = await client.query(
            "UPDATE products SET stock = $1 WHERE id = $2 RETURNING *",
            [newStock, id]
        );

        await client.query("COMMIT");
        res.json(result.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /admin/products/:id/stock error:", err);
        res.status(500).json({ error: "Lỗi server khi cập nhật tồn kho" });
    } finally {
        client.release();
    }
});

// PATCH /api/admin/products/:id/status - Ẩn/hiện sản phẩm (soft delete / khôi phục)
// body: { is_active: boolean }
router.patch("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
        return res.status(400).json({ error: "is_active phải là true hoặc false" });
    }

    try {
        const result = await pool.query(
            "UPDATE products SET is_active = $1 WHERE id = $2 RETURNING *",
            [is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }
        res.json({
            message: is_active ? "Đã hiện lại sản phẩm" : "Đã ẩn sản phẩm",
            product: result.rows[0],
        });
    } catch (err) {
        console.error("PATCH /admin/products/:id/status error:", err);
        res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái" });
    }
});

// Kiểm tra dữ liệu phiên bản; trả về chuỗi lỗi hoặc null
function validateVariant({ name, price, stock, image }) {
    const n = String(name || "").trim();
    if (!n || n.length > 100) return "Tên phiên bản dài từ 1 đến 100 ký tự";
    if (price === undefined || price === "" || !(Number(price) >= 0)) return "Giá phiên bản không hợp lệ";
    if (stock === undefined || stock === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return "Tồn kho phải là số nguyên không âm";
    }
    if (image && !/^https?:\/\/\S+$/.test(String(image).trim())) return "Link ảnh phiên bản không hợp lệ";
    return null;
}

// Ảnh phiên bản: link ngoài thì upload lên Cloudinary, bỏ trống thì dùng ảnh sản phẩm (NULL)
// Trả về { image } hoặc gửi lỗi 400 và trả về null
async function resolveVariantImage(req, res) {
    try {
        return { image: await uploadImageUrl(String(req.body.image || "").trim()) };
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        res.status(400).json({ error: "Không upload được ảnh từ URL này" });
        return null;
    }
}

// POST /api/admin/products/:id/variants - thêm phiên bản (vd "16GB RAM / 512GB SSD", "Màu bạc")
// body: { name, price, stock, image? }
router.post("/:id/variants", async (req, res) => {
    const { id } = req.params;
    const invalid = validateVariant(req.body);
    if (invalid) return res.status(400).json({ error: invalid });

    const uploaded = await resolveVariantImage(req, res);
    if (!uploaded) return;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const product = await client.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [id]);
        if (product.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        const result = await client.query(
            `INSERT INTO product_variants (product_id, name, price, stock, image, sort_order)
             VALUES ($1, $2, $3, $4, $5,
                     COALESCE((SELECT MAX(sort_order) + 1 FROM product_variants WHERE product_id = $1), 0))
             RETURNING id, name, price, stock, image`,
            [id, req.body.name.trim(), Number(req.body.price), Number(req.body.stock), uploaded.image]
        );
        // Sản phẩm đã chuyển sang dạng có phiên bản: dòng giỏ cũ không chọn phiên bản không còn hợp lệ
        await client.query("DELETE FROM cart_items WHERE product_id = $1 AND variant_id IS NULL", [id]);

        await client.query("COMMIT");
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        if (err.code === "23505") {
            return res.status(400).json({ error: "Tên phiên bản đã tồn tại trong sản phẩm này" });
        }
        console.error("POST /admin/products/:id/variants error:", err);
        res.status(500).json({ error: "Lỗi server khi thêm phiên bản" });
    } finally {
        client.release();
    }
});

// PUT /api/admin/products/:id/variants/:variantId - sửa tên/giá/tồn kho/ảnh phiên bản
router.put("/:id/variants/:variantId", async (req, res) => {
    const { id, variantId } = req.params;
    const invalid = validateVariant(req.body);
    if (invalid) return res.status(400).json({ error: invalid });

    const uploaded = await resolveVariantImage(req, res);
    if (!uploaded) return;

    try {
        const result = await pool.query(
            `UPDATE product_variants SET name = $1, price = $2, stock = $3, image = $4
             WHERE id = $5 AND product_id = $6
             RETURNING id, name, price, stock, image`,
            [req.body.name.trim(), Number(req.body.price), Number(req.body.stock), uploaded.image, variantId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phiên bản" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === "23505") {
            return res.status(400).json({ error: "Tên phiên bản đã tồn tại trong sản phẩm này" });
        }
        console.error("PUT /admin/products/:id/variants/:variantId error:", err);
        res.status(500).json({ error: "Lỗi server khi cập nhật phiên bản" });
    }
});

// DELETE /api/admin/products/:id/variants/:variantId - xoá phiên bản
// Giỏ hàng chứa phiên bản này bị xoá theo (ON DELETE CASCADE); đơn cũ giữ lại variant_name
router.delete("/:id/variants/:variantId", async (req, res) => {
    const { id, variantId } = req.params;
    try {
        const result = await pool.query(
            "DELETE FROM product_variants WHERE id = $1 AND product_id = $2 RETURNING id",
            [variantId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phiên bản" });
        }
        res.json({ message: "Đã xoá phiên bản" });
    } catch (err) {
        console.error("DELETE /admin/products/:id/variants/:variantId error:", err);
        res.status(500).json({ error: "Lỗi server khi xoá phiên bản" });
    }
});

module.exports = router;