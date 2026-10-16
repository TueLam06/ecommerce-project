const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get('/', async (req, res) => {
    const allowedSort = {
        name: "name",
        price: "price",
        newest: "id", // đổi thành "created_at" nếu bảng products có cột này
    };
    const allowedOrder = ["asc", "desc"];

    let { category, sort = "newest", order = "desc" } = req.query;

    const sortColumn = allowedSort[sort] || "id";
    const sortOrder = allowedOrder.includes(String(order).toLowerCase())
        ? order.toUpperCase()
        : "DESC";

    try {
        const params = [];
        let whereClause = "WHERE is_active = true";

        if (category) {
            params.push(category);
            whereClause += ` AND category_id = $${params.length}`;
        }

        const result = await pool.query(
            `SELECT * FROM products ${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
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
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
