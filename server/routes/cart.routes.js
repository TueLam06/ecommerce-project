const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// Chuẩn hoá variant_id từ body/query: rỗng -> null, sai định dạng -> undefined (báo lỗi)
function parseVariantId(raw) {
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

// Một dòng giỏ hàng được xác định bởi (product_id, variant_id); variant_id NULL = sản phẩm không có phiên bản
router.get("/", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
         ci.product_id,
         ci.variant_id,
         ci.quantity,
         p.name,
         v.name AS variant_name,
         COALESCE(v.price, p.price) AS price,
         COALESCE(v.image, p.image) AS image,
         COALESCE(v.stock, p.stock) AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = $1
       ORDER BY ci.updated_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
});

// POST /api/cart — thêm sản phẩm vào giỏ (nếu đã có thì cộng dồn quantity)
// Body: { product_id, variant_id?, quantity }
router.post("/", verifyToken, async (req, res) => {
    const { product_id, quantity } = req.body;
    const variantId = parseVariantId(req.body.variant_id);

    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Thiếu product_id hoặc quantity không hợp lệ." });
    }
    if (variantId === undefined) {
        return res.status(400).json({ error: "variant_id không hợp lệ." });
    }

    try {
        // Kiểm tra sản phẩm có tồn tại không (tránh thêm sản phẩm rác vào giỏ)
        const productCheck = await pool.query("SELECT id, stock FROM products WHERE id = $1", [product_id]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại." });
        }

        // Sản phẩm có phiên bản thì bắt buộc chọn đúng 1 phiên bản của nó
        const variants = await pool.query("SELECT id FROM product_variants WHERE product_id = $1", [product_id]);
        if (variants.rows.length > 0) {
            if (variantId === null) {
                return res.status(400).json({ error: "Vui lòng chọn phiên bản sản phẩm." });
            }
            if (!variants.rows.some((v) => v.id === variantId)) {
                return res.status(404).json({ error: "Phiên bản không tồn tại." });
            }
        } else if (variantId !== null) {
            return res.status(400).json({ error: "Sản phẩm này không có phiên bản." });
        }

        const result = await pool.query(
            `INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, (COALESCE(variant_id, 0)))
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()
       RETURNING product_id, variant_id, quantity`,
            [req.user.id, product_id, variantId, quantity]
        );

        res.status(201).json({ message: "Đã thêm vào giỏ hàng.", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
});

// PUT /api/cart/:productId — set số lượng cụ thể cho 1 dòng trong giỏ
// Body: { quantity, variant_id? }
router.put("/:productId", verifyToken, async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const variantId = parseVariantId(req.body.variant_id);

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "quantity phải lớn hơn 0. Dùng DELETE để xoá khỏi giỏ." });
    }
    if (variantId === undefined) {
        return res.status(400).json({ error: "variant_id không hợp lệ." });
    }

    try {
        const result = await pool.query(
            `UPDATE cart_items
       SET quantity = $1, updated_at = now()
       WHERE user_id = $2 AND product_id = $3 AND variant_id IS NOT DISTINCT FROM $4
       RETURNING product_id, variant_id, quantity`,
            [quantity, req.user.id, productId, variantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sản phẩm không có trong giỏ hàng." });
        }

        res.json({ message: "Đã cập nhật số lượng.", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
});

// DELETE /api/cart/:productId?variant_id= — xoá 1 dòng khỏi giỏ
router.delete("/:productId", verifyToken, async (req, res) => {
    const { productId } = req.params;
    const variantId = parseVariantId(req.query.variant_id);

    if (variantId === undefined) {
        return res.status(400).json({ error: "variant_id không hợp lệ." });
    }

    try {
        const result = await pool.query(
            `DELETE FROM cart_items
       WHERE user_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3
       RETURNING product_id`,
            [req.user.id, productId, variantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sản phẩm không có trong giỏ hàng." });
        }

        res.json({ message: "Đã xoá khỏi giỏ hàng." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
});

// DELETE /api/cart — xoá sạch giỏ hàng (dùng sau khi checkout xong)
router.delete("/", verifyToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);
        res.json({ message: "Đã xoá toàn bộ giỏ hàng." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server." });
    }
});

module.exports = router;