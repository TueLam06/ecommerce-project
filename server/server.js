require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const { apiLimiter, chatLimiter } = require('./middleware/rateLimit');

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
pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;
`)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Migrate DB lỗi:', err);
        process.exit(1);
    });
