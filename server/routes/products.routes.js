const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get('/', async (req, res) => {
    const allowedSort = {
        name: "p.name",
        // Sản phẩm có phiên bản thì sắp theo giá thấp nhất của phiên bản
        price: "COALESCE(v.min_price, p.price)",
        newest: "p.id", // đổi thành "p.created_at" nếu bảng products có cột này
    };
    const allowedOrder = ["asc", "desc"];

    let { category, sort = "newest", order = "desc" } = req.query;

    const sortColumn = allowedSort[sort] || "p.id";
    const sortOrder = allowedOrder.includes(String(order).toLowerCase())
        ? order.toUpperCase()
        : "DESC";

    try {
        const params = [];
        let whereClause = "WHERE p.is_active = true";

        if (category) {
            params.push(category);
            whereClause += ` AND p.category_id = $${params.length}`;
        }

        // min_price/variant_count: để thẻ sản phẩm hiện "Từ X đ" khi có nhiều phiên bản
        // variants: để chọn phiên bản ngay trên thẻ sản phẩm; category_name: tên danh mục hiển thị
        const result = await pool.query(
            `SELECT p.*, c.name AS category_name, v.min_price,
                    COALESCE(v.variant_count, 0)::int AS variant_count,
                    COALESCE(v.variants, '[]') AS variants
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN (
                 SELECT product_id, MIN(price) AS min_price, COUNT(*) AS variant_count,
                        json_agg(json_build_object('id', id, 'name', name, 'price', price, 'stock', stock, 'image', image)
                                 ORDER BY sort_order, id) AS variants
                 FROM product_variants
                 GROUP BY product_id
             ) v ON v.product_id = p.id
             ${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1 AND is_active = true',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        const variants = await pool.query(
            `SELECT id, name, price, stock, image FROM product_variants
             WHERE product_id = $1 ORDER BY sort_order, id`,
            [id]
        );
        res.json({ ...result.rows[0], variants: variants.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
