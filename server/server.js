require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const { apiLimiter, chatLimiter } = require('./middleware/rateLimit.middleware');

// Render đứng sau 1 lớp proxy: để req.ip lấy đúng IP thật của client từ X-Forwarded-For
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

const PORT = process.env.PORT || 5000;
const pool = require('./config/db');

const productRoutes = require('./routes/products.routes');
const categoryRoutes = require('./routes/categories.routes');
const chatRoutes = require('./routes/chat.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/orders.routes');
const adminProductRoutes = require('./routes/admin.products.routes');
const adminOrdersRoutes = require('./routes/admin.orders.routes');
const adminStatsRoutes = require('./routes/admin.stats.routes');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/stats', adminStatsRoutes);

// Thêm cột email_verified nếu chưa có. Tài khoản cũ coi như đã xác thực, tài khoản mới mặc định chưa
// Phiên bản sản phẩm: sản phẩm có phiên bản thì giá/tồn kho lấy theo phiên bản, không thì dùng products.price/stock
// cart_items: 1 sản phẩm có thể nằm trong giỏ nhiều lần với các phiên bản khác nhau (variant_id NULL = sản phẩm không có phiên bản)
// order_items: lưu variant_name để đơn cũ vẫn hiển thị đúng khi phiên bản bị xoá
pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;

    -- Mô tả ngắn (1 dòng thông số chính) hiện trên thẻ sản phẩm; description là thông số chi tiết dạng "Nhãn: giá trị" mỗi dòng
    ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description VARCHAR(200);

    CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (product_id, name)
    );

    ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE;
    ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
    CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_variant_key
        ON cart_items (user_id, product_id, (COALESCE(variant_id, 0)));

    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);

    -- Ảnh riêng của phiên bản (vd mỗi màu một ảnh), NULL thì dùng ảnh sản phẩm
    ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image TEXT;

    -- Email nhận thông báo đơn hàng, đơn cũ để NULL
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS email VARCHAR(255);
`)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
            // In host DB để biết đang chạy trên branch dev hay production
            console.log(`Database: ${new URL(process.env.DATABASE_URL).hostname}`);
        });
    })
    .catch((err) => {
        console.error('Migrate DB lỗi:', err);
        process.exit(1);
    });
