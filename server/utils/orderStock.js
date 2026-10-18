// Các hàm cập nhật tồn kho theo đơn hàng — phải gọi bên trong transaction (dùng client, không dùng pool)

// Trả lại tồn kho khi huỷ đơn
// - dòng có variant_id: trả vào phiên bản
// - dòng không có phiên bản (variant_name IS NULL): trả vào sản phẩm
// - phiên bản đã bị xoá (variant_id NULL nhưng còn variant_name) và sản phẩm đã bị xoá (product_id NULL): bỏ qua
async function restoreStock(client, orderId) {
    await client.query(
        `UPDATE product_variants v
         SET stock = v.stock + oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1 AND oi.variant_id = v.id`,
        [orderId]
    );
    await client.query(
        `UPDATE products p
         SET stock = p.stock + oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1 AND oi.product_id = p.id
           AND oi.variant_id IS NULL AND oi.variant_name IS NULL`,
        [orderId]
    );
}

module.exports = { restoreStock };
