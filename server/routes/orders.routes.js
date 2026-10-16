const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, optionalAuth } = require("../middleware/auth.middleware");
const { restoreStock } = require("../utils/orderStock");
const { trackLimiter, orderLimiter } = require("../middleware/rateLimit.middleware");

// Chuẩn hoá SĐT để so sánh: bỏ ký tự không phải số, +84/84 -> 0
function normalizePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.startsWith("84") ? "0" + digits.slice(2) : digits;
}

const DELIVERY_CITIES = ["Thành phố Hà Nội", "Thành phố Hồ Chí Minh"];
const MAX_QTY_PER_ITEM = 20;

// POST /api/orders - tạo đơn (khách vãng lai gửi kèm cart, người đã đăng nhập lấy từ giỏ hàng trên server)
router.post("/", optionalAuth, orderLimiter, async (req, res) => {
    const customer_name = String(req.body.customer_name || "").trim();
    const address = String(req.body.address || "").trim();
    // Chuẩn hoá SĐT: bỏ khoảng trắng/dấu chấm/gạch, +84 -> 0
    const phone = String(req.body.phone || "").replace(/[\s.-]/g, "").replace(/^\+84/, "0");

    if (!customer_name || !phone || !address) {
        return res.status(400).json({ message: "Thiếu customer_name/phone/address" });
    }
    if (customer_name.length < 2 || customer_name.length > 50) {
        return res.status(400).json({ message: "Họ tên dài từ 2 đến 50 ký tự" });
    }
    if (!/^0(3|5|7|8|9)\d{8}$/.test(phone)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    if (address.length > 300 || !DELIVERY_CITIES.some((city) => address.endsWith(`, ${city}`))) {
        return res.status(400).json({ message: "Địa chỉ không hợp lệ (chỉ giao tại Hà Nội và TP.HCM)" });
    }

    const client = await pool.connect();
    try {
        let items = [];

        if (req.user) {
            const cartRes = await client.query(
                "SELECT product_id, quantity FROM cart_items WHERE user_id = $1",
                [req.user.id]
            );
            items = cartRes.rows;
            if (items.length === 0) {
                return res.status(400).json({ message: "Giỏ hàng trống" });
            }
        } else {
            const cart = req.body.cart;
            if (!Array.isArray(cart) || cart.length === 0) {
                return res.status(400).json({ message: "Thiếu cart cho khách vãng lai" });
            }
            items = cart.map((i) => ({ product_id: i.id, quantity: i.quantity }));
        }

        if (items.length > 50) {
            return res.status(400).json({ message: "Giỏ hàng có quá nhiều sản phẩm" });
        }
        // Chặn số lượng âm/thập phân/quá lớn (số âm sẽ làm tăng tồn kho và giảm tổng tiền)
        if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY_PER_ITEM)) {
            return res.status(400).json({ message: `Số lượng mỗi sản phẩm phải từ 1 đến ${MAX_QTY_PER_ITEM}` });
        }

        await client.query("BEGIN");

        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
            const pRes = await client.query(
                "SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE",
                [item.product_id]
            );
            if (pRes.rows.length === 0) {
                throw { status: 404, message: `Sản phẩm id ${item.product_id} không tồn tại` };
            }
            const product = pRes.rows[0];
            if (product.stock < item.quantity) {
                throw {
                    status: 400,
                    message: `Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock}, cần ${item.quantity})`,
                };
            }
            total += Number(product.price) * item.quantity;
            orderItemsData.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
            });
        }

        const orderRes = await client.query(
            `INSERT INTO orders (customer_name, phone, address, total, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [customer_name, phone, address, total, req.user ? req.user.id : null]
        );
        const orderId = orderRes.rows[0].id;

        for (const oi of orderItemsData) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name)
         VALUES ($1, $2, $3, $4, $5)`,
                [orderId, oi.product_id, oi.quantity, oi.price, oi.name]
            );
            await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [
                oi.quantity,
                oi.product_id,
            ]);
        }

        if (req.user) {
            await client.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);
        }

        await client.query("COMMIT");
        return res.status(201).json({ message: "Đặt hàng thành công", orderId, total });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("POST /api/orders error:", err);
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Lỗi server khi tạo đơn hàng" });
    } finally {
        client.release();
    }
});

// POST /api/orders/track - khách (kể cả không đăng nhập) tra đơn bằng mã đơn + SĐT
// body: { orderId, phone } — dùng POST để SĐT không nằm trên URL/log
router.post("/track", trackLimiter, async (req, res) => {
    const { orderId, phone } = req.body;
    const id = Number(String(orderId || "").replace(/^#/, ""));

    if (!Number.isInteger(id) || id <= 0 || !phone) {
        return res.status(400).json({ error: "Vui lòng nhập mã đơn và số điện thoại" });
    }

    try {
        const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
        const order = orderResult.rows[0];
        // Sai mã hay sai SĐT đều trả chung 1 lỗi để không lộ đơn nào tồn tại
        if (!order || normalizePhone(order.phone) !== normalizePhone(phone)) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng khớp với thông tin đã nhập" });
        }

        const itemsResult = await pool.query(
            `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price_at_purchase,
                    p.image, p.is_active AS product_is_active
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1
             ORDER BY oi.id`,
            [id]
        );

        const { user_id, ...publicOrder } = order;
        res.json({ ...publicOrder, items: itemsResult.rows });
    } catch (err) {
        console.error("POST /orders/track error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// GET /api/orders/my - lịch sử mua hàng của user đang đăng nhập
// Mỗi đơn kèm danh sách sản phẩm (items) để hiển thị luôn trên trang lịch sử
router.get("/my", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.id, o.customer_name, o.phone, o.address, o.total, o.status, o.created_at,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', oi.id,
                                'product_id', oi.product_id,
                                'product_name', oi.product_name,
                                'quantity', oi.quantity,
                                'price_at_purchase', oi.price_at_purchase,
                                'image', p.image
                            ) ORDER BY oi.id
                        ) FILTER (WHERE oi.id IS NOT NULL),
                        '[]'
                    ) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET /orders/my error:", err);
        res.status(500).json({ error: "Lỗi server khi lấy lịch sử đơn hàng" });
    }
});

// GET /api/orders/my/:id - chi tiết 1 đơn, chỉ xem được đơn của chính mình
router.get("/my/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
            [id, req.user.id]
        );
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        const itemsResult = await pool.query(
            `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price_at_purchase,
                    p.image, p.is_active AS product_is_active
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1
             ORDER BY oi.id`,
            [id]
        );

        res.json({ ...orderResult.rows[0], items: itemsResult.rows });
    } catch (err) {
        console.error("GET /orders/my/:id error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// PATCH /api/orders/my/:id/cancel - user tự huỷ đơn của mình
// Chỉ huỷ được khi đơn còn "pending"; huỷ xong thì trả lại tồn kho
router.patch("/my/:id/cancel", verifyToken, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            "SELECT id, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE",
            [id, req.user.id]
        );
        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }
        if (orderResult.rows[0].status !== "pending") {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Chỉ huỷ được đơn đang chờ xác nhận" });
        }

        await restoreStock(client, id);

        const updated = await client.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
            [id]
        );

        await client.query("COMMIT");
        res.json(updated.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /orders/my/:id/cancel error:", err);
        res.status(500).json({ error: "Lỗi server khi huỷ đơn hàng" });
    } finally {
        client.release();
    }
});

module.exports = router;
